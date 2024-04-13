"use client"

import { DrawIoEmbed } from 'react-drawio';

export default function DrawioPage() {
  return (
    <DrawIoEmbed urlParameters={{
        ui: 'kennedy',
        spin: true,
        libraries: true,
        saveAndExit: true
      }}
    />
  );
}