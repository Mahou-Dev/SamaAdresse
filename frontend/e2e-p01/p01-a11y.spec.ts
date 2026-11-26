import { test, expect } from '@playwright/test';

const HARNESS_PATH = '/e2e-p01/p01-a11y-harness.html';

test.describe('P01 — Vérification interactive de l’accessibilité (Design System Clarté)', () => {
  test('1. Modal : ouverture/fermeture souris et clavier, piège de focus, stabilité en saisie et restitution du focus', async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);

    const trigger = page.getByTestId('open-modal-trigger');
    await trigger.focus();

    // 1a. Ouverture au clavier (Enter)
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Attendre le focus initial dans la modale (useFocusTrap 30ms)
    const closeBtn = dialog.getByRole('button', { name: 'Fermer la fenêtre' });
    await expect(closeBtn).toBeFocused();

    // 1b. Saisie dans le champ interne (vérifie A-01 : onClose inline ne vole pas le focus)
    const reasonInput = dialog.getByLabel('Motif');
    await reasonInput.focus();
    await page.keyboard.type('Boucotte');
    await expect(reasonInput).toHaveValue('Boucotte');
    await expect(reasonInput).toBeFocused();

    // 1c. Piège de focus Tab / Shift+Tab circulaire
    const confirmBtn = dialog.getByRole('button', { name: 'Valider' });
    await confirmBtn.focus();
    await page.keyboard.press('Tab');
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(confirmBtn).toBeFocused();

    // 1d. Fermeture par Échap + restitution du focus au déclencheur
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();

    // 1e. Ouverture à la souris et fermeture au bouton Fermer + restitution du focus
    await trigger.click();
    await expect(dialog).toBeVisible();
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('2. DropdownMenu : ouverture ArrowDown, navigation flèches/Home/End et fermeture Échap avec retour focus', async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);

    const menuTrigger = page.getByRole('button', { name: 'Ouvrir les actions adresse' });
    await menuTrigger.focus();

    // ArrowDown ouvre le menu et focalise le premier item actif ("Modifier", en sautant l'item désactivé)
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    const editItem = menu.getByRole('menuitem', { name: 'Modifier' });
    const shareItem = menu.getByRole('menuitem', { name: 'Partager' });
    const archiveItem = menu.getByRole('menuitem', { name: 'Archiver' });

    await expect(editItem).toBeFocused();

    // ArrowDown -> Partager, End -> Archiver, Home -> Modifier, ArrowUp -> Archiver
    await page.keyboard.press('ArrowDown');
    await expect(shareItem).toBeFocused();

    await page.keyboard.press('End');
    await expect(archiveItem).toBeFocused();

    await page.keyboard.press('Home');
    await expect(editItem).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(archiveItem).toBeFocused();

    // Fermeture par Échap -> focus restitué au déclencheur
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(menuTrigger).toBeFocused();
  });

  test('3. RadioGroup : point d’entrée clavier sans sélection initiale et navigation par flèches', async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);

    const maison = page.getByRole('radio', { name: 'Maison' });
    const commerce = page.getByRole('radio', { name: 'Commerce' });
    const institution = page.getByRole('radio', { name: 'Institution' });

    // Sans valeur initiale, le premier radio actif porte tabIndex=0
    await expect(maison).toHaveAttribute('tabindex', '0');
    await expect(commerce).toHaveAttribute('tabindex', '-1');

    await maison.focus();
    await page.keyboard.press('ArrowRight');
    await expect(commerce).toBeFocused();
    await expect(commerce).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('ArrowDown');
    await expect(institution).toBeFocused();
    await expect(institution).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(commerce).toBeFocused();
    await expect(page.getByTestId('radio-value')).toContainText('COMMERCE');
  });

  test('4. Tabs : navigation clavier ArrowRight, ArrowLeft, Home, End et bascule des panneaux', async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);

    const profilTab = page.getByRole('tab', { name: 'Profil' });
    const offlineTab = page.getByRole('tab', { name: /Hors ligne/ });
    const aideTab = page.getByRole('tab', { name: 'Aide' });

    await expect(page.getByTestId('panel-content-profil')).toBeVisible();

    await profilTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(offlineTab).toBeFocused();
    await expect(offlineTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('panel-content-offline')).toBeVisible();

    await page.keyboard.press('End');
    await expect(aideTab).toBeFocused();
    await expect(aideTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('panel-content-aide')).toBeVisible();

    await page.keyboard.press('Home');
    await expect(profilTab).toBeFocused();
    await expect(profilTab).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(aideTab).toBeFocused();
  });

  test('5. Checkbox : état indéterminé DOM réel et attribut aria-checked="mixed"', async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);

    const checkbox = page.locator('#indeterminate-checkbox');
    await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    const isDomIndeterminate = await checkbox.evaluate(
      (el) => (el as HTMLInputElement).indeterminate
    );
    expect(isDomIndeterminate).toBe(true);

    // Clic sur le label bascule hors de l'état indéterminé
    await page.getByText('Sélectionner toutes les adresses').click();
    const afterClickIndeterminate = await checkbox.evaluate(
      (el) => (el as HTMLInputElement).indeterminate
    );
    expect(afterClickIndeterminate).toBe(false);
    await expect(checkbox).toBeChecked();
  });

  test('6. SearchBar sur mobile (375×812) : nom accessible du bouton submit et navigation clavier', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HARNESS_PATH);

    const searchInput = page.getByRole('searchbox', { name: 'Rechercher une adresse' });
    const submitBtn = page.getByRole('button', { name: 'Rechercher' });

    // Vérifier que le bouton submit a bien un nom accessible ET une taille tactile >= 44×44 px sur mobile
    await expect(submitBtn).toBeVisible();
    const box = await submitBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Navigation clavier : saisie -> Tab vers Effacer -> Tab vers Rechercher -> Enter soumet
    await searchInput.focus();
    await page.keyboard.type('ZIG-KBG');

    const clearBtn = page.getByRole('button', { name: 'Effacer la recherche' });
    await page.keyboard.press('Tab');
    await expect(clearBtn).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(submitBtn).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByTestId('submitted-query')).toContainText('ZIG-KBG');
  });
});
