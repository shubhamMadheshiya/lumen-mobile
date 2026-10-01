import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuestionCard } from '../QuestionCard';
import { IQuestion, IOption, Answer } from '@lumen/shared';

jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  Presets: { easeInEaseOut: {} },
  configureNext: jest.fn(),
}));

function makeQuestion(overrides: Partial<IQuestion> = {}): IQuestion {
  return {
    _id: 'q1',
    userId: 'u1',
    categoryId: 'cat1',
    title: 'How do you feel?',
    selectionType: 'single',
    allowOther: false,
    required: false,
    frequency: 'anytime',
    order: 0,
    version: 1,
    isActive: true,
    ...overrides,
  } as IQuestion;
}

function makeOption(id: string, label: string): IOption {
  return {
    _id: id,
    userId: 'u1',
    questionId: 'q1',
    label,
    fields: [],
    allowComment: false,
    captureTime: 'none',
    order: 0,
    isActive: true,
  } as unknown as IOption;
}

describe('QuestionCard', () => {
  const options = [makeOption('o1', 'Good'), makeOption('o2', 'Bad')];

  it('renders the question title', () => {
    render(
      <QuestionCard
        question={makeQuestion()}
        options={options}
        answers={[]}
        sessionAnswers={[]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('How do you feel?')).toBeTruthy();
  });

  it('is hidden when conditionalDisplay requires an absent optionId', () => {
    const question = makeQuestion({
      conditionalDisplay: { requiredOptionId: 'must-have-this' },
    });
    const { queryByText } = render(
      <QuestionCard
        question={question}
        options={options}
        answers={[]}
        sessionAnswers={[]} // does NOT contain 'must-have-this'
        onChange={jest.fn()}
      />
    );
    expect(queryByText('How do you feel?')).toBeNull();
  });

  it('is visible when conditionalDisplay required optionId is present in sessionAnswers', () => {
    const question = makeQuestion({
      conditionalDisplay: { requiredOptionId: 'must-have-this' },
    });
    const sessionAnswers: Answer[] = [
      { optionId: 'must-have-this', optionLabelSnapshot: 'Yes', values: [] },
    ];
    render(
      <QuestionCard
        question={question}
        options={options}
        answers={[]}
        sessionAnswers={sessionAnswers}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('How do you feel?')).toBeTruthy();
  });

  it('calls onChange when an option is selected', () => {
    const onChange = jest.fn();
    render(
      <QuestionCard
        question={makeQuestion()}
        options={options}
        answers={[]}
        sessionAnswers={[]}
        onChange={onChange}
      />
    );
    fireEvent.press(screen.getByText('Good'));
    expect(onChange).toHaveBeenCalled();
  });

  it('shows helpText when provided', () => {
    render(
      <QuestionCard
        question={makeQuestion({ helpText: 'Rate how you feel today' })}
        options={options}
        answers={[]}
        sessionAnswers={[]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Rate how you feel today')).toBeTruthy();
  });
});
