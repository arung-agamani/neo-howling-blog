'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const BlockNotePoc = dynamic(
    () => import('@/components/editor/BlockNotePoc'),
    { ssr: false },
);

const EditorTestPage: React.FC = () => {
  return <BlockNotePoc />;
};

export default EditorTestPage;
