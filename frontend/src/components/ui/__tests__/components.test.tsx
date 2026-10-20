import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  Card,
  StatTile,
  StatusBadge,
  Tabs,
  TabPanel,
  DataTable,
  ConfirmDialog,
  SidePanel,
  EmptyState,
} from '../index';
import { AlertCircle, Home } from 'lucide-react';

describe('Composants UI réutilisables (Lot 11A)', () => {
  describe('Card', () => {
    it('rend une carte avec le style Terre & Enseigne', () => {
      const html = renderToStaticMarkup(
        <Card padding="md">
          <p>Contenu test</p>
        </Card>
      );
      expect(html).toContain('bg-[#FBF7EF]');
      expect(html).toContain('border border-[#766B5B]');
      expect(html).toContain('Contenu test');
    });
  });

  describe('StatTile', () => {
    it('affiche le libellé, la valeur et le sous-libellé', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <StatTile
            label="Adresses actives"
            value={12}
            sublabel="Sur 15 adresses"
            icon={Home}
            to="/addresses/mine?status=ACTIVE"
            variant="success"
          />
        </MemoryRouter>
      );
      expect(html).toContain('Adresses actives');
      expect(html).toContain('12');
      expect(html).toContain('Sur 15 adresses');
      expect(html).toContain('href="/addresses/mine?status=ACTIVE"');
      expect(html).toContain('text-[#2A6B44]');
    });
  });

  describe('StatusBadge', () => {
    it('rend correctement le badge ACTIVE', () => {
      const html = renderToStaticMarkup(<StatusBadge status="ACTIVE" />);
      expect(html).toContain('Active');
      expect(html).toContain('text-[#2A6B44]');
    });

    it('rend correctement le badge SUSPENDED', () => {
      const html = renderToStaticMarkup(<StatusBadge status="SUSPENDED" />);
      expect(html).toContain('Suspendue');
      expect(html).toContain('text-[#8A3112]');
    });

    it('rend correctement le badge ARCHIVED', () => {
      const html = renderToStaticMarkup(<StatusBadge status="ARCHIVED" />);
      expect(html).toContain('Archivée');
      expect(html).toContain('text-[#5C4D44]');
    });

    it('rend correctement le badge PENDING', () => {
      const html = renderToStaticMarkup(<StatusBadge status="PENDING" />);
      expect(html).toContain('En attente');
      expect(html).toContain('text-[#8A3112]');
    });
  });

  describe('Tabs et TabPanel', () => {
    it('génère la structure WAI-ARIA conforme (role tablist, tab, tabpanel)', () => {
      const tabs = [
        { id: 'profil', label: 'Profil' },
        { id: 'offline', label: 'Hors ligne', count: 3 },
      ];

      const html = renderToStaticMarkup(
        <div>
          <Tabs tabs={tabs} activeTab="profil" onChange={() => {}} />
          <TabPanel id="profil" activeTab="profil">
            <div>Panneau Profil</div>
          </TabPanel>
          <TabPanel id="offline" activeTab="profil">
            <div>Panneau Hors Ligne</div>
          </TabPanel>
        </div>
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('id="tab-profil"');
      expect(html).toContain('aria-controls="panel-profil"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('aria-selected="false"');
      expect(html).toContain('role="tabpanel"');
      expect(html).toContain('id="panel-profil"');
      expect(html).toContain('aria-labelledby="tab-profil"');
      expect(html).toContain('Panneau Profil');
      // Le panneau inactif est caché
      expect(html).toContain('hidden=""');
    });
  });

  describe('DataTable', () => {
    interface Item {
      id: string;
      code: string;
      name: string;
    }

    const columns = [
      { key: 'code', header: 'Code adresse', sortable: true },
      { key: 'name', header: 'Nom' },
    ];

    const data: Item[] = [
      { id: '1', code: 'ZIG-KBG-4271', name: 'Maison Diallo' },
      { id: '2', code: 'ZIG-ESC-1042', name: 'Boutique Escale' },
    ];

    it('affiche un tableau complet avec attributs de tri aria-sort', () => {
      const html = renderToStaticMarkup(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          sortKey="code"
          sortDirection="asc"
          onSort={() => {}}
        />
      );

      expect(html).toContain('<table');
      expect(html).toContain('aria-sort="ascending"');
      expect(html).toContain('Code adresse');
      expect(html).toContain('ZIG-KBG-4271');
      expect(html).toContain('Boutique Escale');
    });

    it('affiche le message vide quand les données sont vides', () => {
      const html = renderToStaticMarkup(
        <DataTable
          data={[]}
          columns={columns}
          keyExtractor={(row: Item) => row.id}
          emptyMessage="Aucun résultat trouvé."
        />
      );

      expect(html).toContain('Aucun résultat trouvé.');
      expect(html).not.toContain('<table');
    });
  });

  describe('ConfirmDialog', () => {
    it('rend la modale accessible avec les rôles dialog et aria-modal', () => {
      const html = renderToStaticMarkup(
        <ConfirmDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirmer la suppression"
          description="Cette action est irréversible."
          confirmLabel="Supprimer"
          variant="danger"
        />
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="confirm-dialog-title"');
      expect(html).toContain('Confirmer la suppression');
      expect(html).toContain('Cette action est irréversible.');
      expect(html).toContain('Supprimer');
      expect(html).toContain('Annuler');
    });

    it('ne rend rien quand isOpen est false', () => {
      const html = renderToStaticMarkup(
        <ConfirmDialog
          isOpen={false}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Titre"
          description="Description"
        />
      );
      expect(html).toBe('');
    });
  });

  describe('SidePanel', () => {
    it('rend le panneau latéral avec role dialog', () => {
      const html = renderToStaticMarkup(
        <SidePanel
          isOpen={true}
          onClose={() => {}}
          title="Détail du signalement"
          subtitle="ZIG-KBG-4271"
        >
          <div>Contenu détail</div>
        </SidePanel>
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('Détail du signalement');
      expect(html).toContain('ZIG-KBG-4271');
      expect(html).toContain('Contenu détail');
    });
  });

  describe('EmptyState', () => {
    it('affiche le titre, la description et le bouton d’action', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <EmptyState
            icon={AlertCircle}
            title="Aucune adresse enregistrée"
            description="Commencez par ajouter votre première adresse."
            action={{
              label: 'Créer une adresse',
              to: '/addresses/new',
            }}
          />
        </MemoryRouter>
      );

      expect(html).toContain('Aucune adresse enregistrée');
      expect(html).toContain('Commencez par ajouter votre première adresse.');
      expect(html).toContain('href="/addresses/new"');
      expect(html).toContain('Créer une adresse');
    });
  });
});
