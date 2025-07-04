'use client'

import { useState } from "react";
import BlobWaves from "./Shaders/BlobWaves";
import GradientPlasma from "./Shaders/GradientPlasma";
import Histogram from "./Shaders/Histogram";
import MovingBandsScene from "./Shaders/MovingBands";
import AuroraStarsShader from "./Shaders/Aurora";
import WaveformShader from "./Shaders/WaveForm";
import Diffraction from "./Shaders/Diffraction";


export default function page() {
  const [selectedShader, setSelectedShader] = useState('bands');

  const renderShader = () => {
    switch(selectedShader) {
      case 'plasma':
        return <GradientPlasma />;
      case 'blobs':
        return <BlobWaves />;
      case 'histogram':
        return <Histogram />
     case 'aurora':
        return <AuroraStarsShader />
      case 'waveform':
        return <WaveformShader />

        case 'diffraction':
          return <Diffraction />
     
      default:
        return <MovingBandsScene />;
    }
  };

  return (
    <div className="h-screen w-screen relative">
      <div className="flex absolute z-[999] top-0 left-0 gap-4 p-4">
        {[
          { id: 'bands', label: 'Moving Bands' },
          { id: 'plasma', label: 'Gradient Plasma' },
          { id: 'aurora', label: 'Aurora' },
          { id: 'blobs', label: 'Blob Waves' },
          { id: 'histogram', label: 'Histogram' },
          { id: 'waveform', label: 'Waveform' },
          { id: 'diffraction', label: 'Diffraction' }
        ].map(shader => (
          <button
            key={shader.id}
            onClick={() => setSelectedShader(shader.id)}
            className="px-4 py-2 cursor-pointer bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            {shader.label}
          </button>
        ))}
      </div>
      {renderShader()}
    </div>
  );
}
