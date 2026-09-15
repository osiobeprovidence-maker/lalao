import React from 'react';
import { Rally } from '../../types';
import { PostItem } from './PostItem';

export interface RallyCardProps {
  rally: Rally;
  onSelectCreator?: () => void;
}

/**
 * RallyCard now delegates directly to the unified PostItem component,
 * ensuring that Rallies and regular Feed Posts share the exact same
 * card markup, width, avatar layout, typography hierarchy, and action row styling.
 */
export const RallyCard: React.FC<RallyCardProps> = ({ rally, onSelectCreator }) => {
  return <PostItem rally={rally} onSelectAuthor={onSelectCreator} />;
};
