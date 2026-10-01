/**
 * Client-side validation of log entry answers against field definitions.
 * Returns the first error string found, or null if everything passes.
 */
import { Answer, IOption, FieldValue, FieldDefinition } from '@lumen/shared';

function validateFieldValue(fv: FieldValue, def: FieldDefinition): string | null {
  const v = fv.value;

  switch (def.dataType) {
    case 'number':
    case 'temperature':
    case 'range': {
      if (typeof v !== 'number') return `${def.label}: expected a number`;
      if (def.min !== undefined && v < def.min) return `${def.label}: minimum is ${def.min}`;
      if (def.max !== undefined && v > def.max) return `${def.label}: maximum is ${def.max}`;
      break;
    }
    case 'duration': {
      if (typeof v !== 'number' || v < 0) return `${def.label}: enter a valid duration`;
      break;
    }
    case 'string': {
      if (typeof v !== 'string') return `${def.label}: expected text`;
      break;
    }
    case 'boolean': {
      if (typeof v !== 'boolean') return `${def.label}: expected yes/no`;
      break;
    }
    case 'enum': {
      const validKeys = (def.enumValues ?? []).map(e => e.value);
      const keys = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
      for (const k of keys) {
        if (!validKeys.includes(k as string)) {
          return `${def.label}: "${k}" is not a valid option`;
        }
      }
      break;
    }
    case 'image': {
      if (!Array.isArray(v)) return `${def.label}: expected image list`;
      break;
    }
    case 'location': {
      if (!Array.isArray(v)) return `${def.label}: expected location list`;
      break;
    }
  }

  return null;
}

export function validateAnswers(
  answers: Answer[],
  options: IOption[],
): string | null {
  for (const answer of answers) {
    if (answer.optionId === '__other__') continue;

    const option = options.find(o => o._id === answer.optionId);
    if (!option) continue;

    for (const fieldDef of option.fields) {
      const fv = answer.values.find(v => v.fieldKey === fieldDef.key);

      if (fieldDef.required && (!fv || fv.value === undefined || fv.value === null || fv.value === '')) {
        return `"${option.label}" → "${fieldDef.label}" is required`;
      }

      if (fv) {
        const err = validateFieldValue(fv, fieldDef);
        if (err) return `"${option.label}" → ${err}`;
      }
    }
  }

  return null;
}
