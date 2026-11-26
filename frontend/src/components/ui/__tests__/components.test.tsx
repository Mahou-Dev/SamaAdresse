import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AlertCircle, Home, Plus, Search, User } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  Badge,
  Avatar,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Skeleton,
  Spinner,
  Tooltip,
  Tabs,
  TabPanel,
  Breadcrumb,
  EmptyState,
  ErrorState,
  Alert,
  ToastItem,
  Modal,
  Drawer,
  DropdownMenu,
  StatTile,
  StatusBadge,
  DataTable,
  ConfirmDialog,
  SidePanel,
  PageHeader,
} from '../index';

describe('Composants UI du Design System SamaAdresse 2.0 Clarté', () => {
  describe('Button & IconButton', () => {
    it('rend Button dans ses variantes et états (loading, disabled, lien)', () => {
      const primaryHtml = renderToStaticMarkup(
        <Button variant="primary" leftIcon={Plus}>
          Créer une adresse
        </Button>
      );
      expect(primaryHtml).toContain('bg-brand');
      expect(primaryHtml).toContain('Créer une adresse');

      const loadingHtml = renderToStaticMarkup(
        <Button isLoading loadingText="Enregistrement…">
          Valider
        </Button>
      );
      expect(loadingHtml).toContain('aria-busy="true"');
      expect(loadingHtml).toContain('disabled=""');
      expect(loadingHtml).toContain('Enregistrement…');

      const linkHtml = renderToStaticMarkup(
        <MemoryRouter>
          <Button to="/annuaire" variant="outline">
            Annuaire
          </Button>
        </MemoryRouter>
      );
      expect(linkHtml).toContain('href="/annuaire"');
      expect(linkHtml).toContain('Annuaire');
    });

    it('rend IconButton avec aria-label accessible', () => {
      const html = renderToStaticMarkup(
        <IconButton icon={Search} aria-label="Lancer la recherche" variant="subtle" />
      );
      expect(html).toContain('aria-label="Lancer la recherche"');
      expect(html).toContain('bg-surface');
    });
  });

  describe('Primitives de formulaire (Input, Textarea, Select, Checkbox, RadioGroup, Switch)', () => {
    it('rend Input avec label, état erreur et attributs ARIA', () => {
      const html = renderToStaticMarkup(
        <Input
          label="Adresse e-mail"
          required
          error="Format d'e-mail invalide"
          value="abc"
          onChange={() => {}}
        />
      );
      expect(html).toContain('Adresse e-mail');
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('role="alert"');
      expect(html).toContain('Format d&#x27;e-mail invalide');
    });

    it('rend Textarea avec compteur de caractères', () => {
      const html = renderToStaticMarkup(
        <Textarea
          label="Repères visuels"
          maxLength={200}
          showCount
          value="Portail vert"
          onChange={() => {}}
        />
      );
      expect(html).toContain('Repères visuels');
      expect(html).toContain('12/200');
    });

    it('rend Select avec options et placeholder', () => {
      const html = renderToStaticMarkup(
        <Select
          label="Quartier"
          placeholder="Choisir un quartier"
          options={[
            { value: 'KBG', label: 'Boucotte' },
            { value: 'ESC', label: 'Escale' },
          ]}
          value=""
          onChange={() => {}}
        />
      );
      expect(html).toContain('Quartier');
      expect(html).toContain('Choisir un quartier');
      expect(html).toContain('Boucotte');
      expect(html).toContain('Escale');
    });

    it('rend Checkbox avec description et état coché', () => {
      const html = renderToStaticMarkup(
        <Checkbox
          label="Publier dans l'annuaire"
          description="Rendre cette adresse visible publiquement"
          checked={true}
          onChange={() => {}}
        />
      );
      expect(html).toContain('checked=""');
      expect(html).toContain('Rendre cette adresse visible publiquement');
    });

    it('rend RadioGroup accessible avec role radiogroup et radio', () => {
      const html = renderToStaticMarkup(
        <RadioGroup
          label="Type de lieu"
          variant="segmented"
          value="MAISON"
          onChange={() => {}}
          options={[
            { value: 'MAISON', label: 'Maison' },
            { value: 'COMMERCE', label: 'Commerce' },
          ]}
        />
      );
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain('role="radio"');
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('aria-checked="false"');
    });

    it('rend Switch accessible avec role switch et aria-checked', () => {
      const html = renderToStaticMarkup(
        <Switch
          label="Afficher mon nom"
          description="Visible sur la fiche annuaire"
          checked={true}
          onChange={() => {}}
        />
      );
      expect(html).toContain('role="switch"');
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('Afficher mon nom');
    });
  });

  describe('Badge, Avatar, Divider, Skeleton, Spinner, Tooltip', () => {
    it('rend Badge, Avatar (initiales + statut), Divider, Skeleton, Spinner, Tooltip', () => {
      const badgeHtml = renderToStaticMarkup(
        <Badge variant="brand" dot>
          Nouveau
        </Badge>
      );
      expect(badgeHtml).toContain('bg-brand-soft');
      expect(badgeHtml).toContain('Nouveau');

      const avatarHtml = renderToStaticMarkup(<Avatar name="Fatou Ndiaye" status="online" />);
      expect(avatarHtml).toContain('FN');
      expect(avatarHtml).toContain('aria-label="En ligne"');

      const dividerHtml = renderToStaticMarkup(<Divider label="ou" />);
      expect(dividerHtml).toContain('role="separator"');
      expect(dividerHtml).toContain('ou');

      const skeletonHtml = renderToStaticMarkup(<Skeleton count={3} variant="text" />);
      expect((skeletonHtml.match(/animate-pulse/g) || []).length).toBe(3);

      const spinnerHtml = renderToStaticMarkup(<Spinner label="Synchronisation" />);
      expect(spinnerHtml).toContain('role="status"');
      expect(spinnerHtml).toContain('Synchronisation');

      const tooltipHtml = renderToStaticMarkup(
        <Tooltip content="Copier le code">
          <button type="button">Aide</button>
        </Tooltip>
      );
      expect(tooltipHtml).toContain('Aide');
    });
  });

  describe('Card', () => {
    it('rend une carte avec les jetons sémantiques Clarté et ses sections', () => {
      const html = renderToStaticMarkup(
        <Card padding="md" variant="elevated">
          <CardHeader>En-tête</CardHeader>
          <CardBody>Contenu test</CardBody>
          <CardFooter>Pied</CardFooter>
        </Card>
      );
      expect(html).toContain('bg-surface-elevated');
      expect(html).toContain('border border-border');
      expect(html).toContain('Contenu test');
    });
  });

  describe('StatTile', () => {
    it('affiche le libellé, la valeur, le sous-libellé et la variante succès', () => {
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
      expect(html).toContain('text-success');
    });
  });

  describe('StatusBadge', () => {
    it('rend correctement les statuts ACTIVE, SUSPENDED, ARCHIVED, PENDING', () => {
      const activeHtml = renderToStaticMarkup(<StatusBadge status="ACTIVE" />);
      expect(activeHtml).toContain('Active');
      expect(activeHtml).toContain('text-success');

      const suspendedHtml = renderToStaticMarkup(<StatusBadge status="SUSPENDED" />);
      expect(suspendedHtml).toContain('Suspendue');
      expect(suspendedHtml).toContain('text-danger');

      const archivedHtml = renderToStaticMarkup(<StatusBadge status="ARCHIVED" />);
      expect(archivedHtml).toContain('Archivée');
      expect(archivedHtml).toContain('text-ink-muted');

      const pendingHtml = renderToStaticMarkup(<StatusBadge status="PENDING" />);
      expect(pendingHtml).toContain('En attente');
      expect(pendingHtml).toContain('text-warning');
    });
  });

  describe('Tabs, TabPanel & Breadcrumb', () => {
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
      expect(html).toContain('hidden=""');
    });

    it("rend Breadcrumb avec nav aria-label et aria-current sur l'élément actif", () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <Breadcrumb
            items={[
              { label: 'Accueil', to: '/' },
              { label: 'Annuaire', to: '/annuaire' },
              { label: 'ZIG-KBG-4271' },
            ]}
          />
        </MemoryRouter>
      );
      expect(html).toContain('aria-label="Fil d&#x27;Ariane"');
      expect(html).toContain('href="/annuaire"');
      expect(html).toContain('aria-current="page"');
      expect(html).toContain('ZIG-KBG-4271');
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

  describe('Feedback & Overlays (Alert, ErrorState, ToastItem, Modal, Drawer, ConfirmDialog, SidePanel, DropdownMenu, EmptyState, PageHeader)', () => {
    it('rend Alert, ErrorState et ToastItem accessibles', () => {
      const alertHtml = renderToStaticMarkup(
        <Alert variant="warning" title="Mode hors ligne" onDismiss={() => {}}>
          Les brouillons seront synchronisés dès le retour réseau.
        </Alert>
      );
      expect(alertHtml).toContain('role="alert"');
      expect(alertHtml).toContain('Mode hors ligne');

      const errorHtml = renderToStaticMarkup(
        <MemoryRouter>
          <ErrorState errorCode={500} onRetry={() => {}} homeTo="/" />
        </MemoryRouter>
      );
      expect(errorHtml).toContain('Erreur 500');
      expect(errorHtml).toContain('Réessayer');
      expect(errorHtml).toContain('href="/"');

      const toastHtml = renderToStaticMarkup(
        <ToastItem
          toast={{ id: '1', type: 'success', title: 'Succès', message: 'Adresse enregistrée' }}
          onDismiss={() => {}}
        />
      );
      expect(toastHtml).toContain('role="status"');
      expect(toastHtml).toContain('Adresse enregistrée');
    });

    it('rend Modal et Drawer avec role dialog et aria-modal', () => {
      const modalHtml = renderToStaticMarkup(
        <Modal isOpen={true} onClose={() => {}} title="Partager" description="Lien public">
          <p>Contenu modale</p>
        </Modal>
      );
      expect(modalHtml).toContain('role="dialog"');
      expect(modalHtml).toContain('aria-modal="true"');
      expect(modalHtml).toContain('Partager');

      const drawerHtml = renderToStaticMarkup(
        <Drawer isOpen={true} onClose={() => {}} title="Filtres" side="bottom">
          <p>Contenu tiroir</p>
        </Drawer>
      );
      expect(drawerHtml).toContain('role="dialog"');
      expect(drawerHtml).toContain('Filtres');
    });

    it('rend ConfirmDialog accessible avec les IDs attendus', () => {
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

      const closedHtml = renderToStaticMarkup(
        <ConfirmDialog
          isOpen={false}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Titre"
          description="Description"
        />
      );
      expect(closedHtml).toBe('');
    });

    it('rend SidePanel, DropdownMenu, EmptyState et PageHeader', () => {
      const panelHtml = renderToStaticMarkup(
        <SidePanel
          isOpen={true}
          onClose={() => {}}
          title="Détail du signalement"
          subtitle="ZIG-KBG-4271"
        >
          <div>Contenu détail</div>
        </SidePanel>
      );
      expect(panelHtml).toContain('role="dialog"');
      expect(panelHtml).toContain('Détail du signalement');

      const menuHtml = renderToStaticMarkup(
        <DropdownMenu
          trigger={<span>Menu</span>}
          triggerAriaLabel="Ouvrir le menu"
          items={[{ id: '1', label: 'Compte', icon: User }]}
        />
      );
      expect(menuHtml).toContain('aria-haspopup="menu"');
      expect(menuHtml).toContain('aria-expanded="false"');

      const emptyHtml = renderToStaticMarkup(
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
      expect(emptyHtml).toContain('Aucune adresse enregistrée');
      expect(emptyHtml).toContain('href="/addresses/new"');

      const headerHtml = renderToStaticMarkup(
        <MemoryRouter>
          <PageHeader
            title="Mes adresses"
            subtitle="Gérez vos plaques"
            breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Mes adresses' }]}
            action={{ label: 'Nouvelle adresse', to: '/addresses/new' }}
          />
        </MemoryRouter>
      );
      expect(headerHtml).toContain('Mes adresses');
      expect(headerHtml).toContain('Fil d&#x27;Ariane');
      expect(headerHtml).toContain('href="/addresses/new"');
    });
  });
});
