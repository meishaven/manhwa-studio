import type { AioDeviceInfo } from './aioStageCatalog.types';
import type { TranslationModel } from './types';

export type ModelHardwareFitStatus =
  | 'recommended'
  | 'caution'
  | 'avoid'
  | 'unknown'
  | 'download_only';

export interface ModelHardwareFit {
  status: ModelHardwareFitStatus;
  reasonKey: string;
  reasonVars?: Readonly<Record<string, string | number>>;
  minimumRamGb: number | null;
}

type HardwareFitModel = Readonly<
  Pick<
    TranslationModel,
    'id' | 'requirements' | 'minVramGb' | 'runtimeSupport' | 'runtimeFamily' | 'fileSize'
  >
>;

const parseGb = (value: string | undefined): number | null => {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)\s*GB/i);
  return match ? Number(match[1]) : null;
};

const parseFileBytes = (value: string | undefined): number => {
  if (!value) return 0;
  const match = value.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2].toUpperCase() === 'GB'
    ? amount * 1024 ** 3
    : amount * 1024 ** 2;
};

/**
 * Conservative, explainable compatibility estimate. It never changes the
 * catalogue or model availability: it only annotates existing local entries.
 * A benchmark is still needed to measure actual inference speed.
 */
export function assessModelHardwareFit(
  model: HardwareFitModel,
  device: AioDeviceInfo | null,
): ModelHardwareFit {
  const minimumRamGb = parseGb(model.requirements.ramMin);

  if (model.runtimeSupport === 'download_only') {
    return {
      status: 'download_only',
      reasonKey: 'modelHardware.reason.downloadOnly',
      minimumRamGb,
    };
  }

  if (!device || device.ram_total_gb == null) {
    return {
      status: 'unknown',
      reasonKey: 'modelHardware.reason.unknown',
      minimumRamGb,
    };
  }

  const hasSupportedGpuRuntime =
    device.has_gpu &&
    (
      device.nvidia_cuda_available === true ||
      device.amd_rocm_available === true ||
      device.profile === 'apple-mps' ||
      (device.vram_gb !== null && device.vram_gb > 0)
    );

  if (model.requirements.gpu && !hasSupportedGpuRuntime) {
    return {
      status: 'avoid',
      reasonKey: 'modelHardware.reason.gpu',
      minimumRamGb,
    };
  }

  const requiredVramGb = model.minVramGb ?? parseGb(model.requirements.vramMin) ?? 0;
  if (requiredVramGb > 0) {
    const availableVramGb = device.vram_gb ?? 0;
    if (availableVramGb < requiredVramGb) {
      return {
        status: 'avoid',
        reasonKey: 'modelHardware.reason.vram',
        reasonVars: {
          required: requiredVramGb,
          available: availableVramGb,
        },
        minimumRamGb,
      };
    }
  }

  if (minimumRamGb === null) {
    return {
      status: 'caution',
      reasonKey: 'modelHardware.reason.unspecifiedRam',
      minimumRamGb,
    };
  }

  const totalRamGb = device.ram_total_gb;
  // Keep a realistic reserve for Windows, the app, image buffers and other
  // processes. The model's declared RAM minimum is not treated as the whole
  // computer's complete memory budget.
  const reservedRamGb = Math.max(1.5, totalRamGb * 0.28);
  const safeModelBudgetGb = Math.max(0, totalRamGb - reservedRamGb);

  if (minimumRamGb > safeModelBudgetGb || minimumRamGb >= totalRamGb - 0.5) {
    return {
      status: 'avoid',
      reasonKey: 'modelHardware.reason.ram',
      reasonVars: {
        required: minimumRamGb,
        budget: Number(safeModelBudgetGb.toFixed(1)),
      },
      minimumRamGb,
    };
  }

  if (
    device.ram_available_gb != null &&
    device.ram_available_gb < minimumRamGb + 0.4
  ) {
    return {
      status: 'caution',
      reasonKey: 'modelHardware.reason.availableRam',
      reasonVars: {
        required: minimumRamGb,
        available: Number(device.ram_available_gb.toFixed(1)),
      },
      minimumRamGb,
    };
  }

  const largeCpuModel =
    !device.has_gpu &&
    (device.cpu_cores ?? Number.POSITIVE_INFINITY) <= 4 &&
    parseFileBytes(model.fileSize) >= 2.5 * 1024 ** 3 &&
    ['gguf', 'transformers', 'ctranslate2'].includes(model.runtimeFamily ?? '');

  if (largeCpuModel || minimumRamGb >= totalRamGb * 0.45) {
    return {
      status: 'caution',
      reasonKey: largeCpuModel
        ? 'modelHardware.reason.cpu'
        : 'modelHardware.reason.ram',
      reasonVars: largeCpuModel
        ? { cores: device.cpu_cores ?? 4 }
        : {
            required: minimumRamGb,
            budget: Number(safeModelBudgetGb.toFixed(1)),
          },
      minimumRamGb,
    };
  }

  return {
    status: 'recommended',
    reasonKey: 'modelHardware.reason.good',
    minimumRamGb,
  };
}
