import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Lock } from 'lucide-react';
import type { AddressResponse } from '../../api/addressApi';
import { StatusBadge } from '../../components/ui';
import { getLocationTypeLabel } from '../../utils/locationTypes';

export interface MyAddressesTableProps {
  addresses: AddressResponse[];
  isOnline: boolean;
  restoringId: string | null;
  togglingVisibilityId: string | null;
  onRequestArchive: (address: AddressResponse) => void;
  onRestore: (addressId: string) => void;
  onRequestVisibilityToggle: (address: AddressResponse) => void;
}

export const MyAddressesTable: React.FC<MyAddressesTableProps> = ({
  addresses,
  isOnline,
  restoringId,
  togglingVisibilityId,
  onRequestArchive,
  onRestore,
  onRequestVisibilityToggle,
}) => {
  return (
    <div
      data-testid="addresses-list-view"
      className="hidden lg:block rounded-2xl border border-border bg-surface-elevated shadow-xs overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm" aria-label="Liste de mes adresses">
          <thead>
            <tr className="bg-surface border-b border-border text-ink-secondary text-xs uppercase tracking-wide">
              <th scope="col" className="py-3.5 px-4 font-semibold">Code</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Statut & Visibilité</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Quartier & Type</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Description</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Date</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {addresses.map((address) => {
              const isActive = address.status === 'ACTIVE';
              const isArchived = address.status === 'ARCHIVED';
              const isSuspended = address.status === 'SUSPENDED';

              return (
                <tr key={address.id} className="hover:bg-surface/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-ink whitespace-nowrap">
                    {isActive ? (
                      <Link
                        to={`/a/${address.code}`}
                        className="text-institution hover:text-institution-hover hover:underline"
                      >
                        {address.code}
                      </Link>
                    ) : (
                      <span className="text-ink-muted">{address.code}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={address.status} size="sm" />
                      {isSuspended && (
                        <span className="text-[11px] font-semibold text-danger">
                          Suspendue par la modération
                        </span>
                      )}
                      {address.listed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-institution-soft text-institution border border-institution-border">
                          <Globe className="w-3 h-3" aria-hidden="true" />
                          <span>Dans l'annuaire</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-ink-muted border border-border">
                          <Lock className="w-3 h-3" aria-hidden="true" />
                          <span>Privée</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary whitespace-nowrap">
                    <span className="font-semibold text-ink">{address.quartier}</span> ·{' '}
                    {getLocationTypeLabel(address.locationType)}
                  </td>
                  <td
                    className="py-3.5 px-4 max-w-xs truncate text-ink-secondary"
                    title={address.description}
                  >
                    {address.description || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-ink-muted whitespace-nowrap">
                    {new Date(address.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-3 text-xs">
                    {isActive && (
                      <>
                        <Link
                          to={`/a/${address.code}`}
                          title="Ouvrir la fiche publique"
                          className="font-semibold text-institution hover:underline"
                        >
                          Voir
                        </Link>
                        <Link
                          to={`/addresses/${address.id}/edit`}
                          className="font-semibold text-ink-secondary hover:text-ink"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          disabled={togglingVisibilityId === address.id || !isOnline}
                          onClick={() => onRequestVisibilityToggle(address)}
                          className="font-semibold text-ink-secondary hover:text-institution cursor-pointer disabled:opacity-45"
                        >
                          {address.listed ? 'Masquer' : 'Publier'}
                        </button>
                        <button
                          type="button"
                          disabled={!isOnline}
                          onClick={() => onRequestArchive(address)}
                          className="font-semibold text-danger hover:underline cursor-pointer disabled:opacity-45"
                        >
                          Archiver
                        </button>
                      </>
                    )}
                    {isArchived && (
                      <button
                        type="button"
                        disabled={restoringId === address.id || !isOnline}
                        onClick={() => onRestore(address.id)}
                        className="font-semibold text-institution hover:underline cursor-pointer disabled:opacity-45"
                      >
                        {restoringId === address.id ? 'Restauration…' : 'Restaurer'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
