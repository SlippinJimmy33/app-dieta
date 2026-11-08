import { PageHeader } from '../../components/ui/PageHeader'

type ComingSoonPageProps = {
  eyebrow: string
  title: string
}

export function ComingSoonPage({ eyebrow, title }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <p className="px-6 pt-6 text-[15px] text-muted">Aquesta secció arriba en els propers passos de la F1.</p>
    </>
  )
}
