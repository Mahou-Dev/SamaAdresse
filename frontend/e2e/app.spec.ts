import { expect, test } from '@playwright/test'

const DEMO_EMAIL = 'demo@samaadresse.sn'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || ''

test.describe('SamaAdresse E2E — Nouveau Frontend connecté au Backend Spring Boot', () => {
  test('Accueil, recherche par code, fiche publique ZIG-KBG-4271, QR code et repli SPA', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Localisez')

    // Recherche par code depuis la page d'accueil
    await page.getByLabel('Code SamaAdresse').fill('ZIG-KBG-4271')
    await page.getByRole('form', { name: 'Recherche par code' }).getByRole('button', { name: 'Rechercher' }).click()
    await expect(page.getByRole('heading', { name: 'ZIG-KBG-4271' })).toBeVisible()

    // Accès fiche publique + rechargement direct SPA
    await page.getByRole('link', { name: /Voir la fiche/ }).click()
    await expect(page).toHaveURL(/\/a\/ZIG-KBG-4271$/)
    await expect(page.getByRole('heading', { level: 1, name: 'ZIG-KBG-4271' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'ZIG-KBG-4271' })).toBeVisible()

    // Photo de façade chargée depuis PostgreSQL /uploads/
    const facadeImg = page.locator('.address-sheet__banner img')
    await expect(facadeImg).toBeVisible()
    const naturalWidth = await facadeImg.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)

    // Page partage QR code
    await page.getByRole('link', { name: /QR code/ }).click()
    await expect(page).toHaveURL(/\/a\/ZIG-KBG-4271\/partage$/)
    await expect(page.getByRole('img', { name: /QR code menant à/ })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('Annuaire, redirections rétrocompatibles (/annuaire, /login), gardes protégées et 404', async ({ page }) => {
    // Redirection rétrocompatible /annuaire -> /recherche
    await page.goto('/annuaire')
    await expect(page).toHaveURL(/\/recherche$/)
    await expect(page.getByRole('heading', { name: 'Recherche d’adresse' })).toBeVisible()

    // Onglet Type de lieu -> résultats réels depuis /api/public/directory
    await page.getByRole('tab', { name: 'Type de lieu' }).click()
    await expect(page.locator('.directory__list a[href^="/a/"]').first()).toBeVisible()

    // Redirection rétrocompatible /login -> /connexion
    await page.goto('/login')
    await expect(page).toHaveURL(/\/connexion$/)
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()

    // Route protégée anonyme -> redirection /connexion
    await page.goto('/mes-adresses')
    await expect(page).toHaveURL(/\/connexion$/)

    // Route inexistante -> page 404 Clarté après repli SPA
    await page.goto('/route-inexistante-e2e')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/introuvable|404/i)
  })

  test('Parcours connecté complet : connexion, tableau de bord, création, archivage, restauration, déconnexion', async ({ page }) => {
    test.skip(!DEMO_PASSWORD, 'DEMO_PASSWORD non défini dans l’environnement')

    await page.goto('/connexion')
    await page.getByLabel('E-mail').fill(DEMO_EMAIL)
    await page.getByLabel('Mot de passe').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page).toHaveURL(/\/tableau-de-bord$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonjour')

    // Création d'une adresse dans une zone couverte (Ziguinchor / Boucotte - Kangourou)
    await page.goto('/mes-adresses/nouvelle')
    await page.getByLabel('Type de lieu').selectOption('MAISON')
    await page.getByLabel('Nom du lieu').fill('Maison E2E CI Migration')
    await page.getByLabel(/Repères visuels/).fill('Portail vert test automatisé')
    await page.getByRole('button', { name: /Suivant/ }).click()

    await page.getByLabel('Latitude').fill('12.5738')
    await page.getByLabel('Longitude').fill('-16.2650')
    await expect(page.getByText(/Ziguinchor · Boucotte - Kangourou/)).toBeVisible()
    await page.getByRole('button', { name: /Suivant/ }).click()

    // Étape 3 Photo (facultative) -> Étape 4 Validation
    await page.getByRole('button', { name: /Suivant/ }).click()
    await page.getByLabel(/Non, accessible uniquement/).check()
    await page.getByRole('button', { name: /Enregistrer l’adresse/ }).click()

    await expect(page).toHaveURL(/\/mes-adresses\/[0-9a-f-]+$/)
    await expect(page.getByText(/Adresse enregistrée et active avec le code définitif/)).toBeVisible()

    // Archivage puis restauration
    await page.getByRole('button', { name: 'Archiver l’adresse' }).click()
    await page.getByRole('button', { name: 'Confirmer l’archivage' }).click()
    await expect(page.getByRole('button', { name: /Restaurer l’adresse/ })).toBeVisible()

    await page.getByRole('button', { name: /Restaurer l’adresse/ }).click()
    await expect(page.getByText(/Adresse restaurée et de nouveau active/)).toBeVisible()

    // Déconnexion
    await page.locator('aside').getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
