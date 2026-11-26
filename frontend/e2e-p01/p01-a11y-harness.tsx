import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  Button,
  Checkbox,
  DropdownMenu,
  Input,
  Modal,
  RadioGroup,
  Tabs,
  TabPanel,
} from '../src/components/ui';
import { SearchBar } from '../src/components/shared';

export function P01A11yHarness() {
  // 1. Modal avec onClose inline + champ texte interne (vérification anti-vol de focus A-01)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState('');

  // 2. DropdownMenu
  const [lastMenuAction, setLastMenuAction] = useState('aucune');

  // 3. RadioGroup (initialement sans sélection pour vérifier le fallback tabIndex=0)
  const [radioValue, setRadioValue] = useState('');

  // 4. Tabs
  const [activeTab, setActiveTab] = useState('profil');

  // 5. Checkbox indéterminé
  const [indeterminate, setIndeterminate] = useState(true);
  const [checked, setChecked] = useState(false);

  // 6. SearchBar mobile
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  return (
    <MemoryRouter>
      <main className="max-w-3xl mx-auto p-6 space-y-8 bg-canvas text-ink">
        <h1 className="text-2xl font-extrabold text-ink">
          Harnais d'accessibilité interactive P01
        </h1>

        {/* Section 1 : Modal */}
        <section aria-labelledby="sec-modal" className="space-y-3">
          <h2 id="sec-modal" className="text-lg font-bold">
            1. Modal et piège de focus
          </h2>
          <Button
            id="open-modal-trigger"
            data-testid="open-modal-trigger"
            onClick={() => setModalOpen(true)}
          >
            Ouvrir la modale
          </Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirmation d'adresse"
            description="Saisissez un motif ou fermez avec Échap."
            footer={
              <>
                <Button
                  id="modal-cancel-btn"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  id="modal-confirm-btn"
                  variant="primary"
                  onClick={() => setModalOpen(false)}
                >
                  Valider
                </Button>
              </>
            }
          >
            <Input
              id="modal-reason-input"
              label="Motif"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
            />
          </Modal>
        </section>

        {/* Section 2 : DropdownMenu */}
        <section aria-labelledby="sec-dropdown" className="space-y-3">
          <h2 id="sec-dropdown" className="text-lg font-bold">
            2. DropdownMenu clavier
          </h2>
          <DropdownMenu
            trigger={
              <span className="px-4 py-2 rounded-xl border border-border-strong bg-surface-elevated text-sm font-semibold">
                Actions adresse
              </span>
            }
            triggerAriaLabel="Ouvrir les actions adresse"
            items={[
              { id: 'disabled-item', label: 'Action indisponible', disabled: true },
              {
                id: 'edit',
                label: 'Modifier',
                onClick: () => setLastMenuAction('edit'),
              },
              {
                id: 'share',
                label: 'Partager',
                onClick: () => setLastMenuAction('share'),
              },
              {
                id: 'archive',
                label: 'Archiver',
                danger: true,
                dividerBefore: true,
                onClick: () => setLastMenuAction('archive'),
              },
            ]}
          />
          <p data-testid="last-menu-action" className="text-xs text-ink-muted">
            Dernière action : {lastMenuAction}
          </p>
        </section>

        {/* Section 3 : RadioGroup */}
        <section aria-labelledby="sec-radio" className="space-y-3">
          <h2 id="sec-radio" className="text-lg font-bold">
            3. RadioGroup clavier
          </h2>
          <RadioGroup
            label="Type de lieu"
            variant="segmented"
            value={radioValue}
            onChange={setRadioValue}
            options={[
              { value: 'MAISON', label: 'Maison' },
              { value: 'COMMERCE', label: 'Commerce' },
              { value: 'INSTITUTION', label: 'Institution' },
            ]}
          />
          <p data-testid="radio-value" className="text-xs text-ink-muted">
            Valeur radio : {radioValue || 'aucune'}
          </p>
        </section>

        {/* Section 4 : Tabs */}
        <section aria-labelledby="sec-tabs" className="space-y-3">
          <h2 id="sec-tabs" className="text-lg font-bold">
            4. Tabs clavier
          </h2>
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'profil', label: 'Profil' },
              { id: 'offline', label: 'Hors ligne', count: 2 },
              { id: 'aide', label: 'Aide' },
            ]}
          />
          <TabPanel id="profil" activeTab={activeTab}>
            <div data-testid="panel-content-profil">Contenu Profil</div>
          </TabPanel>
          <TabPanel id="offline" activeTab={activeTab}>
            <div data-testid="panel-content-offline">Contenu Hors ligne</div>
          </TabPanel>
          <TabPanel id="aide" activeTab={activeTab}>
            <div data-testid="panel-content-aide">Contenu Aide</div>
          </TabPanel>
        </section>

        {/* Section 5 : Checkbox indéterminé */}
        <section aria-labelledby="sec-checkbox" className="space-y-3">
          <h2 id="sec-checkbox" className="text-lg font-bold">
            5. Checkbox indéterminé
          </h2>
          <Checkbox
            id="indeterminate-checkbox"
            label="Sélectionner toutes les adresses"
            indeterminate={indeterminate}
            checked={checked}
            onChange={(e) => {
              setIndeterminate(false);
              setChecked(e.target.checked);
            }}
          />
        </section>

        {/* Section 6 : SearchBar */}
        <section aria-labelledby="sec-search" className="space-y-3">
          <h2 id="sec-search" className="text-lg font-bold">
            6. SearchBar mobile et clavier
          </h2>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={setSubmittedQuery}
            onClear={() => setSubmittedQuery('')}
            submitLabel="Rechercher"
          />
          <p data-testid="submitted-query" className="text-xs text-ink-muted">
            Recherche soumise : {submittedQuery}
          </p>
        </section>
      </main>
    </MemoryRouter>
  );
}
