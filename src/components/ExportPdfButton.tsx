'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ExportPdfButton({ targetId, fileName }: { targetId: string, fileName: string }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const element = document.getElementById(targetId)
            if (!element) {
                alert('Elemento não encontrado para exportação.')
                setIsExporting(false)
                return
            }

            // Snapshot em alta qualidade
            const canvas = await html2canvas(element, { scale: 2, useCORS: true })
            const imgData = canvas.toDataURL('image/png')

            // Paisagem (A4 size: 297x210 mm)
            const pdf = new jsPDF('landscape', 'mm', 'a4')

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`${fileName}.pdf`)

        } catch (err) {
            console.error('Erro ao gerar PDF:', err)
            alert('Falha ao exportar PDF.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="text-indigo-600 font-bold hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar PDF Escolar
        </button>
    )
}
