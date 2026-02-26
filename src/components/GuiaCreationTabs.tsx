'use client'

import { useState } from 'react'
import { BotMessageSquare, Pencil } from 'lucide-react'
import UploadForm from './UploadForm'
import ManualGuiaForm from './ManualGuiaForm'

type Turma = { id: string, nome: string, ano_serie: string }
type Disciplina = { id: string, nome: string }

export default function GuiaCreationTabs({ turmas, disciplinas }: { turmas: Turma[], disciplinas: Disciplina[] }) {
    const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')

    return (
        <div>
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 mb-8">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'ai'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <BotMessageSquare className="w-5 h-5" />
                    Gerar com Inteligência Artificial
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'manual'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <Pencil className="w-5 h-5" />
                    Preencher Manualmente
                </button>
            </div>

            {/* Content Area */}
            <div className="relative min-h-[400px]">
                {/* AI Form */}
                <div className={`transition-all duration-300 absolute inset-0 ${activeTab === 'ai' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10 blur-sm'}`}>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Importação Automática</h2>
                        <p className="text-slate-500 text-sm mb-6">Faça o upload do Word (docx) e deixe a IA cuidar do preenchimento das colunas.</p>
                        <UploadForm />
                    </div>
                </div>

                {/* Manual Form */}
                <div className={`transition-all duration-300 ${activeTab === 'manual' ? 'opacity-100 z-10' : 'absolute opacity-0 pointer-events-none -z-10 blur-sm'}`}>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Criação Manual</h2>
                        <p className="text-slate-500 text-sm mb-6">Preencha os dados básicos para iniciar um novo Guia de Aprendizagem em branco.</p>
                        <ManualGuiaForm turmas={turmas} disciplinas={disciplinas} />
                    </div>
                </div>
            </div>
        </div>
    )
}
