import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="app-page app-page--narrow page-standalone">
      <section className="panel state">
        <h1>Page introuvable</h1>
        <p>Cette page n’existe pas.</p>
        <Link className="button button-primary" to="/">Retour à l’accueil</Link>
      </section>
    </main>
  )
}
