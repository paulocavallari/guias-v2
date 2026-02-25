-- 1. Tabela de Turmas
CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano_serie TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabela de Disciplinas
CREATE TABLE disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Tabela de Usuários (Extensão do Auth)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Aluno', 'Professor', 'CGPG', 'Admin')),
  is_lider BOOLEAN DEFAULT FALSE,
  is_vice_lider BOOLEAN DEFAULT FALSE,
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Cabeçalho do Guia de Aprendizagem
CREATE TABLE guias_aprendizagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
  professor_nome TEXT NOT NULL,
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE RESTRICT,
  disciplina_nome TEXT NOT NULL,
  turma_id UUID REFERENCES turmas(id) ON DELETE RESTRICT,
  ano_serie TEXT NOT NULL,
  bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
  total_aulas_bimestre INTEGER NOT NULL,
  ano_letivo INTEGER NOT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Conteúdo Semanal (Semanas do Guia)
CREATE TABLE semanas_guia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guia_id UUID REFERENCES guias_aprendizagem(id) ON DELETE CASCADE,
  data_semana TEXT NOT NULL,
  conteudos TEXT,
  metodologias TEXT,
  estrategias_didaticas TEXT,
  avaliacao TEXT,
  apontamentos_comentarios TEXT,
  data_apontamento_lider TIMESTAMP WITH TIME ZONE,
  status_validacao TEXT DEFAULT 'Pendente' CHECK (status_validacao IN ('Pendente', 'Aguardando Validação', 'Validado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Trigger Automático de Role e Perfil
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'Aluno';
BEGIN
  IF NEW.email = 'paulocavallari@professor.educacao.sp.gov.br' THEN
    v_role := 'Admin';
  ELSIF NEW.email LIKE '%@professor.educacao.sp.gov.br' THEN
    v_role := 'Professor';
  ELSIF NEW.email LIKE '%@educacao.sp.gov.br' AND NEW.email NOT LIKE '%@aluno.educacao.sp.gov.br' AND NEW.email NOT LIKE '%@professor.educacao.sp.gov.br' THEN
    v_role := 'CGPG';
  END IF;

  INSERT INTO public.usuarios (id, nome, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email, v_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Habilitar RLS
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias_aprendizagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE semanas_guia ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança RLS
-- (Lógica Simplificada: Admin e CGPG vêem tudo, Professores vêem seus guias/turmas, Alunos vêem guias da turma)

CREATE POLICY "Public read for turmas" ON turmas FOR SELECT USING (true);
CREATE POLICY "Public read for disciplinas" ON disciplinas FOR SELECT USING (true);

-- Usuarios
CREATE POLICY "Usuarios podem ver a si mesmos" ON usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Gestores veem todos" ON usuarios FOR SELECT USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('Admin', 'CGPG'))
);

-- Guias
CREATE POLICY "Guias publicos para leitura" ON guias_aprendizagem FOR SELECT USING (true);
CREATE POLICY "Professores podem inserir guias" ON guias_aprendizagem FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('Professor', 'Admin'))
);

-- Semanas (Conteudo)
CREATE POLICY "Semanas publicas para leitura" ON semanas_guia FOR SELECT USING (true);
CREATE POLICY "Lideres podem atualizar apontamento" ON semanas_guia FOR UPDATE USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND (is_lider = TRUE OR is_vice_lider = TRUE))
);
CREATE POLICY "Professores podem alterar status e editar" ON semanas_guia FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('Professor', 'Admin'))
);
