import React from 'react';
import type { AddressStatus, ReportStatus } from '../../api/addressApi';
import { StatusBadge } from '../ui/StatusBadge';

export type AddressDomainStatus = AddressStatus | ReportStatus | 'PENDING';

export interface AddressStatusBadgeProps {
  status: AddressDomainStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge sémantique dédié au cycle de vie réel des adresses et signalements SamaAdresse.
 */
export const AddressStatusBadge: React.FC<AddressStatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  className,
}) => {
  return <StatusBadge status={status} label={label} size={size} className={className} />;
};
