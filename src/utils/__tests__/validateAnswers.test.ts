import { validateAnswers } from '../validateAnswers';
import { Answer, IOption, FieldDefinition } from '@lumen/shared';

function makeOption(id: string, fields: FieldDefinition[] = []): IOption {
  return {
    _id: id,
    questionId: 'q1',
    userId: 'u1',
    label: 'Option ' + id,
    fields,
    allowComment: false,
    captureTime: 'none',
    order: 0,
    isActive: true,
  } as unknown as IOption;
}

function makeAnswer(optionId: string, values: Answer['values'] = []): Answer {
  return {
    optionId,
    optionLabelSnapshot: 'Label',
    values,
  };
}

describe('validateAnswers', () => {
  it('returns null when answers are empty', () => {
    expect(validateAnswers([], [])).toBeNull();
  });

  it('returns null when no fields are required and values are absent', () => {
    const options = [makeOption('o1', [
      { key: 'severity', label: 'Severity', dataType: 'range', required: false, min: 0, max: 10 } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [])];
    expect(validateAnswers(answers, options)).toBeNull();
  });

  it('returns error when a required field has no value', () => {
    const options = [makeOption('o1', [
      { key: 'severity', label: 'Severity', dataType: 'range', required: true, min: 0, max: 10 } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [])];
    expect(validateAnswers(answers, options)).toMatch(/severity/i);
  });

  it('returns error when a range value is below min', () => {
    const options = [makeOption('o1', [
      { key: 'pain', label: 'Pain', dataType: 'range', required: false, min: 0, max: 10 } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'pain', dataType: 'range', value: -1 }])];
    expect(validateAnswers(answers, options)).toMatch(/pain/i);
  });

  it('returns error when a range value is above max', () => {
    const options = [makeOption('o1', [
      { key: 'pain', label: 'Pain', dataType: 'range', required: false, min: 0, max: 10 } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'pain', dataType: 'range', value: 11 }])];
    expect(validateAnswers(answers, options)).toMatch(/pain/i);
  });

  it('returns error when a required string field is blank', () => {
    const options = [makeOption('o1', [
      { key: 'note', label: 'Note', dataType: 'string', required: true } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'note', dataType: 'string', value: '' }])];
    expect(validateAnswers(answers, options)).toMatch(/note/i);
  });

  it('returns null for a valid string value', () => {
    const options = [makeOption('o1', [
      { key: 'note', label: 'Note', dataType: 'string', required: true } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'note', dataType: 'string', value: 'hello' }])];
    expect(validateAnswers(answers, options)).toBeNull();
  });

  it('returns error for an enum value not in enumValues list', () => {
    const options = [makeOption('o1', [
      {
        key: 'type',
        label: 'Type',
        dataType: 'enum',
        required: false,
        enumValues: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
      } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'type', dataType: 'enum', value: 'z' }])];
    expect(validateAnswers(answers, options)).toMatch(/type/i);
  });

  it('returns null for a valid enum value', () => {
    const options = [makeOption('o1', [
      {
        key: 'type',
        label: 'Type',
        dataType: 'enum',
        required: false,
        enumValues: [{ value: 'a', label: 'A' }],
      } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'type', dataType: 'enum', value: 'a' }])];
    expect(validateAnswers(answers, options)).toBeNull();
  });

  it('returns error for a boolean field with non-boolean value', () => {
    const options = [makeOption('o1', [
      { key: 'done', label: 'Done', dataType: 'boolean', required: false } as FieldDefinition,
    ])];
    const answers = [makeAnswer('o1', [{ fieldKey: 'done', dataType: 'boolean', value: 'yes' as unknown as boolean }])];
    expect(validateAnswers(answers, options)).toMatch(/done/i);
  });

  it('returns null when an answer option is not in the options list (graceful)', () => {
    const answers = [makeAnswer('unknown-option-id', [])];
    expect(validateAnswers(answers, [])).toBeNull();
  });

  it('validates multiple answers and returns first error', () => {
    const options = [
      makeOption('o1', [{ key: 'a', label: 'A', dataType: 'range', required: true, min: 0, max: 5 } as FieldDefinition]),
      makeOption('o2', [{ key: 'b', label: 'B', dataType: 'string', required: true } as FieldDefinition]),
    ];
    const answers = [
      makeAnswer('o1', []),
      makeAnswer('o2', [{ fieldKey: 'b', dataType: 'string', value: '' }]),
    ];
    const result = validateAnswers(answers, options);
    expect(result).not.toBeNull();
  });
});
