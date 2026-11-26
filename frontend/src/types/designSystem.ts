export type ComponentSize = 'sm' | 'md' | 'lg';

export type ExtendedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SemanticTone = 'neutral' | 'brand' | 'institution' | 'success' | 'warning' | 'danger';

export type FeedbackVariant = 'info' | 'success' | 'warning' | 'danger';

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}
