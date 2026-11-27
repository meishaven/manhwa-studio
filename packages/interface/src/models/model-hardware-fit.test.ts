import { describe, expect, it } from 'vitest';

import type { AioDeviceInfo } from './aioStageCatalog.types';
import { assessModelHardwareFit } from './model-hardware-fit';

const model = (
  overrides: Partial<Parameters<typeof assessModelHardwareFit>[0]> = {},
): Parameters<typeof assessModelHardwareFit>[0] => ({
  id: 'nllb-200-600m-int8',
  requirements: {
    gpu: false,
    vramMin: '0',
    ramMin: '2GB RAM',
    diskSpace: '1GB',
  },
  minVramGb: undefined,
  runtimeSupport: 'runnable',
  runtimeFamily: 'ctranslate2',
  fileSize: '617MB',
  ...overrides,
});

const pc = (overrides: Partial<AioDeviceInfo> = {}): AioDeviceInfo => ({
  name: 'CPU',
  has_gpu: false,
  provider: 'CPUExecutionProvider',
  vram_gb: null,
  cpu_name: 'Intel Core i5-4570',
  cpu_cores: 4,
  cpu_threads: 4,
  ram_total_gb: 8,
  ram_available_gb: 5,
  architecture: 'AMD64',
  profile: 'cpu',
  ...overrides,
});

describe('assessModelHardwareFit', () => {
  it('marks a lightweight CPU model as a good fit on an 8 GB PC', () => {
    expect(assessModelHardwareFit(model(), pc())).toMatchObject({
      status: 'recommended',
      reasonKey: 'modelHardware.reason.good',
    });
  });

  it('warns rather than recommending when a model uses a large share of system RAM', () => {
    expect(
      assessModelHardwareFit(
        model({ requirements: { gpu: false, vramMin: '0', ramMin: '4GB RAM', diskSpace: '2GB' } }),
        pc(),
      ).status,
    ).toBe('caution');
  });

  it('rejects a model whose declared RAM minimum leaves no safe memory for Windows', () => {
    expect(
      assessModelHardwareFit(
        model({ requirements: { gpu: false, vramMin: '0', ramMin: '8GB RAM', diskSpace: '8GB' } }),
        pc(),
      ),
    ).toMatchObject({
      status: 'avoid',
      reasonKey: 'modelHardware.reason.ram',
    });
  });

  it('rejects GPU-required models when no supported GPU is detected', () => {
    expect(
      assessModelHardwareFit(
        model({ requirements: { gpu: true, vramMin: '4GB', ramMin: '4GB RAM', diskSpace: '2GB' } }),
        pc(),
      ),
    ).toMatchObject({
      status: 'avoid',
      reasonKey: 'modelHardware.reason.gpu',
    });
  });

  it('warns when only a small amount of RAM is currently available', () => {
    expect(
      assessModelHardwareFit(model(), pc({ ram_available_gb: 1.8 })),
    ).toMatchObject({
      status: 'caution',
      reasonKey: 'modelHardware.reason.availableRam',
    });
  });

  it('warns for large CPU-only models on a four-core CPU', () => {
    expect(
      assessModelHardwareFit(
        model({ fileSize: '4.5GB', runtimeFamily: 'gguf' }),
        pc({ ram_total_gb: 16, ram_available_gb: 10 }),
      ),
    ).toMatchObject({
      status: 'caution',
      reasonKey: 'modelHardware.reason.cpu',
    });
  });

  it('keeps download-only catalogue entries visible but marks them non-runnable', () => {
    expect(
      assessModelHardwareFit(model({ runtimeSupport: 'download_only' }), pc()),
    ).toMatchObject({
      status: 'download_only',
      reasonKey: 'modelHardware.reason.downloadOnly',
    });
  });

  it('does not guess when hardware details are missing', () => {
    expect(assessModelHardwareFit(model(), null)).toMatchObject({
      status: 'unknown',
      reasonKey: 'modelHardware.reason.unknown',
    });
  });
});
