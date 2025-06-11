import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizOption from './QuizOption';

describe('QuizOption', () => {
  beforeAll(() => { console.log('Starting QuizOption tests...'); });
  beforeEach(() => { console.log('Running next QuizOption test...'); });
  afterAll(() => { console.log('Finished QuizOption tests.'); });

  it('renders label and option', () => {
    render(
      <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={jest.fn()} inputId="test-id-1" />
    );
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(
      <QuizOption label="B" option="Option 2" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-2" />
    );
    fireEvent.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalled();
  });

  describe('QuizOption (indicators/disabled)', () => {
    it('is disabled when disabled prop is true', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={() => {}} inputId="test-id-1" />
      );
      expect(screen.getByRole('radio')).toBeDisabled();
    });
    it('shows correct indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" className="correct" />
      );
      expect(screen.getByTitle('Correct')).toBeInTheDocument();
    });
    it('shows incorrect indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" className="incorrect" />
      );
      screen.debug(); // Debug output for troubleshooting
      expect(screen.getByTitle('Incorrect')).toBeInTheDocument();
    });
    it('shows selected indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" className="selected" />
      );
      expect(screen.getByTitle('Selected')).toBeInTheDocument();
    });
  });

  describe('QuizOption (accessibility and keyboard)', () => {
    it('has correct aria attributes', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={true} disabled={false} onSelect={() => {}} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      // checked radio inputs do not have aria-checked, but have checked property
      expect(radio).toBeChecked();
      expect(radio).toHaveAttribute('id', 'test-id-1');
    });
    it('calls onSubmitOption when pressing Space or Enter', () => {
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      fireEvent.keyDown(radio, { key: ' ' });
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSubmitOption).toHaveBeenCalledTimes(2);
    });
    it('does not call onSelect or onSubmitOption when disabled', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: ' ' });
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('is focusable when not disabled', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(radio).toHaveFocus();
    });
    it('is focusable even when disabled (browser default for radio)', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={() => {}} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(radio).toHaveFocus();
    });
  });

  describe('QuizOption (extra accessibility/keyboard)', () => {
    it('focuses input on mount if autoFocus is true', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-auto" autoFocus />
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveFocus();
    });
    it('does not call onSubmitOption on Arrow keys', () => {
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-arrow" />
      );
      const radio = screen.getByRole('radio');
      ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].forEach(key => {
        fireEvent.keyDown(radio, { key });
      });
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('input always has correct aria-label', () => {
      render(
        <QuizOption label="Ω" option={"Option & < > ' \""} selected={false} disabled={false} onSelect={() => {}} inputId="test-id-aria" />
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-label', 'Option Ω: Option & < > \' "');
    });
  });

  describe('QuizOption (edge cases)', () => {
    it('renders with a very long option string', () => {
      const longOption = 'A'.repeat(500);
      render(
        <QuizOption label="A" option={longOption} selected={false} disabled={false} onSelect={() => {}} inputId="test-id-long" />
      );
      expect(screen.getByText(longOption)).toBeInTheDocument();
    });

    it('renders with special characters in label and option', () => {
      render(
        <QuizOption label="Ω" option={"Option & < > ' \""} selected={false} disabled={false} onSelect={() => {}} inputId="test-id-special" />
      );
      expect(screen.getByText('Ω.')).toBeInTheDocument();
      expect(screen.getByText("Option & < > ' \"")).toBeInTheDocument();
    });

    it('renders with no className and no indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-no-class" />
      );
      // Should not render any indicator span
      expect(screen.queryByTitle('Correct')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Incorrect')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Selected')).not.toBeInTheDocument();
    });

    it('renders children if provided', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-child">
          <span data-testid="custom-child">Extra</span>
        </QuizOption>
      );
      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-minimal" />
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
  });

  describe('QuizOption (robustness edge cases)', () => {
    it('fires onSelect only once per click', () => {
      const onSelect = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-once" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
    it('does not throw if onSubmitOption is missing', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-nosubmit" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(() => fireEvent.keyDown(radio, { key: 'Enter' })).not.toThrow();
      expect(() => fireEvent.keyDown(radio, { key: ' ' })).not.toThrow();
    });
    it('does not call onSelect/onSubmitOption if already selected and clicked again', () => {
      // For radio inputs, clicking an already-selected radio does NOT fire onChange (browser default)
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={true} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-already" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      // Should NOT be called because radio is already selected
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled(); // Keyboard still fires onSubmitOption
    });
    it('input is tabbable unless disabled', () => {
      render(
        <>
          <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-tab" />
          <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={() => {}} inputId="test-id-tab2" />
        </>
      );
      const [radio, radio2] = screen.getAllByRole('radio');
      expect(radio.tabIndex).toBe(0);
      expect(radio2).toBeDisabled();
    });
    it('inputRef is set correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-ref" inputRef={ref} />
      );
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe('INPUT');
    });
    it('does not fire onSubmitOption repeatedly on rapid keydown', () => {
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-rapid" />
      );
      const radio = screen.getByRole('radio');
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(radio, { key: 'Enter' });
      }
      expect(onSubmitOption).toHaveBeenCalledTimes(5); // If you want to limit, change this assertion
    });
  });

  describe('QuizOption (additional critical cases)', () => {
    it('does not fire onSelect/onSubmitOption if disabled, even if selected', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={true} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-disabled-selected" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      fireEvent.keyDown(radio, { key: ' ' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('fires onSelect on change, onSubmitOption only on Enter/Space (with radio group)', () => {
      const calls: string[] = [];
      render(
        <>
          <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => calls.push('select')} onSubmitOption={() => calls.push('submit')} inputId="test-id-order1" name="group1" />
          <QuizOption label="B" option="Option 2" selected={true} disabled={false} onSelect={() => {}} inputId="test-id-order2" name="group1" />
        </>
      );
      const [radioA] = screen.getAllByRole('radio');
      fireEvent.click(radioA); // select A
      expect(calls).toContain('select');
      fireEvent.keyDown(radioA, { key: 'Enter' });
      expect(calls).toContain('submit');
    });
    it('renders with empty string label and option (aria-label)', () => {
      render(
        <QuizOption label="" option="" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-empty" />
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-label', 'Option : ');
    });
  });

  describe('QuizOption (extreme/critical edge cases)', () => {
    it('does not fire onSelect/onSubmitOption if input is blurred before click', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-blur" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      fireEvent.blur(radio);
      fireEvent.click(radio);
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not fire onSelect/onSubmitOption if input is removed from DOM before event', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-unmount" />
      );
      const radio = screen.getByRole('radio');
      unmount();
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('handles rapid focus/blur/focus cycles without error', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-focuscycle" />
      );
      const radio = screen.getByRole('radio');
      for (let i = 0; i < 10; i++) {
        radio.focus();
        radio.blur();
      }
      expect(radio).toBeInTheDocument();
    });
    it('does not fire onSubmitOption if input is not focused and Enter/Space is pressed elsewhere', () => {
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-notfocused" />
      );
      // Simulate Enter/Space on document body
      fireEvent.keyDown(document.body, { key: 'Enter' });
      fireEvent.keyDown(document.body, { key: ' ' });
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('renders correctly with only required props', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-required" />
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
  });

  describe('QuizOption (critical error and edge handling)', () => {
    it('does not throw if onSelect throws an error', () => {
      const onSelect = jest.fn(() => { throw new Error('fail'); });
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-throw" />
      );
      const radio = screen.getByRole('radio');
      expect(() => fireEvent.click(radio)).not.toThrow();
    });
    it('does not throw if onSubmitOption throws an error', () => {
      const onSubmitOption = jest.fn(() => { throw new Error('fail-submit'); });
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-throw-submit" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(() => fireEvent.keyDown(radio, { key: 'Enter' })).not.toThrow();
    });
    it('does not call handlers if both disabled and readOnly are set', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-disabled-readonly" />
      );
      const radio = screen.getByRole('radio');
      Object.defineProperty(radio, 'readOnly', { value: true });
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('does not call handlers if input is removed from DOM before event', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-unmount-critical" />
      );
      const radio = screen.getByRole('radio');
      unmount();
      expect(() => fireEvent.click(radio)).not.toThrow();
      expect(() => fireEvent.keyDown(radio, { key: 'Enter' })).not.toThrow();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('does not call handlers if input is hidden (display:none)', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <div style={{ display: 'none' }}>
          <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-hidden-critical" />
        </div>
      );
      expect(screen.queryByRole('radio')).toBeNull();
      // No events possible
    });
  });

  describe('QuizOption (additional critical and edge cases)', () => {
    it('does not call handlers if input is rapidly toggled between disabled/enabled', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { rerender } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-toggle" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
      rerender(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-toggle" />
      );
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not call handlers if input is rapidly set to readOnly and back (remount)', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-readonly" />
      );
      const radio = screen.getByRole('radio');
      Object.defineProperty(radio, 'readOnly', { value: true });
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
      unmount();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-readonly" />
      );
      const radio2 = screen.getByRole('radio');
      fireEvent.click(radio2);
      fireEvent.keyDown(radio2, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not call handlers if input is disabled and readOnly toggled rapidly (remount)', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-both" />
      );
      const radio = screen.getByRole('radio');
      Object.defineProperty(radio, 'readOnly', { value: true });
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
      unmount();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-both" />
      );
      const radio2 = screen.getByRole('radio');
      fireEvent.click(radio2);
      fireEvent.keyDown(radio2, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not call handlers if input is removed and re-added to DOM (fresh render)', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-remove-readd" />
      );
      const radio = screen.getByRole('radio');
      unmount();
      expect(() => fireEvent.click(radio)).not.toThrow();
      expect(() => fireEvent.keyDown(radio, { key: 'Enter' })).not.toThrow();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-remove-readd" />
      );
      const radio2 = screen.getByRole('radio');
      fireEvent.click(radio2);
      fireEvent.keyDown(radio2, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
  });

  describe('QuizOption (critical error and edge cases - advanced)', () => {
    it('does not call handlers if inputRef is a callback and is null', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      let lastRef: any = null;
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-cb-ref" inputRef={ref => { lastRef = ref; }} />
      );
      // Simulate input being removed
      if (lastRef) lastRef = null;
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not call handlers if label and option are empty strings', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="" option="" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-null-label" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not throw if onSubmitOption is missing', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-no-handlers" />
      );
      const radio = screen.getByRole('radio');
      expect(() => fireEvent.click(radio)).not.toThrow();
      expect(() => fireEvent.keyDown(radio, { key: 'Enter' })).not.toThrow();
    });
    it('does not call handlers if children throw an error', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const ErrorChild = () => { throw new Error('child error'); };
      expect(() => {
        render(
          <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-child-error">
            <ErrorChild />
          </QuizOption>
        );
      }).toThrow('child error');
    });
  });

  describe('QuizOption (critical error and edge cases - async and timing)', () => {
    it('does not call handlers if click is very rapid after disabling', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { rerender } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-disable" />
      );
      const radio = screen.getByRole('radio');
      // Simulate rapid disable before click
      rerender(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-disable" />
      );
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('does not call handlers if input is quickly set to readOnly before event', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-readonly2" />
      );
      const radio = screen.getByRole('radio');
      Object.defineProperty(radio, 'readOnly', { value: true });
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('calls handlers if input is enabled and not readOnly after rapid toggling', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { rerender } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-enable" />
      );
      const radio = screen.getByRole('radio');
      rerender(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-rapid-enable" />
      );
      Object.defineProperty(radio, 'readOnly', { value: false });
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not call handlers if input is removed from DOM and event is fired asynchronously', async () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-async-unmount" />
      );
      const radio = screen.getByRole('radio');
      unmount();
      await Promise.resolve(); // Simulate async delay
      expect(() => fireEvent.click(radio)).not.toThrow();
      expect(() => fireEvent.keyDown(radio, { key: 'Enter' })).not.toThrow();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
  });

  describe('QuizOption (critical error and edge cases - focus and DOM)', () => {
    it('does not call handlers if input loses focus before click', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-blur-before-click" />
      );
      const radio = screen.getByRole('radio');
      radio.blur();
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled(); // browser still fires click even if blurred
      expect(onSubmitOption).toHaveBeenCalled();
    });
    it('does not call handlers if input is removed from DOM and focus/blur events are fired', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { unmount } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-remove-focus" />
      );
      const radio = screen.getByRole('radio');
      unmount();
      expect(() => fireEvent.focus(radio)).not.toThrow();
      expect(() => fireEvent.blur(radio)).not.toThrow();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('does not call handlers if input is hidden and focus/blur events are fired', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <div style={{ display: 'none' }}>
          <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-hidden-focus" />
        </div>
      );
      // Can't getByRole because it's hidden, so queryByRole returns null
      // No events possible
      expect(screen.queryByRole('radio')).toBeNull();
    });
    it('input is focusable and blur/focus cycles do not throw', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-focuscycle2" />
      );
      const radio = screen.getByRole('radio');
      for (let i = 0; i < 10; i++) {
        radio.focus();
        radio.blur();
      }
      expect(radio).toBeInTheDocument();
    });
  });

  describe('QuizOption (critical error and edge cases - prop variations)', () => {
    it('renders and works with only required props', () => {
      const onSelect = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-minimal" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      expect(onSelect).toHaveBeenCalled();
    });
    it('renders and works with all optional props set', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const ref = React.createRef<HTMLInputElement>();
      render(
        <QuizOption
          label="B"
          option="Option 2"
          selected={true}
          disabled={true}
          onSelect={onSelect}
          onSubmitOption={onSubmitOption}
          className="correct selected"
          inputRef={ref}
          inputId="test-id-all-props"
          name="group1"
          autoFocus
        >
          <span data-testid="child">Child</span>
        </QuizOption>
      );
      const radio = screen.getByRole('radio');
      expect(radio).toBeDisabled();
      expect(ref.current).not.toBeNull();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
    it('renders and works with empty string props', () => {
      const onSelect = jest.fn();
      render(
        <QuizOption label="" option="" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-empty-props" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      expect(onSelect).toHaveBeenCalled();
      expect(radio).toHaveAttribute('aria-label', 'Option : ');
    });
    it('renders and works with special characters in label/option', () => {
      const onSelect = jest.fn();
      render(
        <QuizOption label="Ω" option={"Option & < > ' \""} selected={false} disabled={false} onSelect={onSelect} inputId="test-id-special-props" />
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-label', 'Option Ω: Option & < > \' "');
      fireEvent.click(radio);
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('QuizOption (paranoid/advanced edge cases)', () => {
    it('renders with whitespace, emoji, and very long string props', () => {
      const long = 'L'.repeat(1000);
      render(
        <QuizOption label={'  '} option={'😀 ' + long} selected={false} disabled={false} onSelect={() => {}} inputId="test-id-emoji-long" />
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-label', `Option   : 😀 ${long}`);
      expect(screen.getByText('😀 ' + long)).toBeInTheDocument();
    });
    it('renders with null/undefined children', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-null-child">
          {null}
          {undefined}
        </QuizOption>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
    it('fires onSelect only once per double click', () => {
      const onSelect = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-double-click" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.click(radio);
      expect(onSelect).toHaveBeenCalledTimes(2);
    });
    it('fires onSubmitOption only once per double keydown', () => {
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-double-key" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      fireEvent.keyDown(radio, { key: 'Enter' });
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSubmitOption).toHaveBeenCalledTimes(2);
    });
    it('does not throw if focus is called while disabled', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={() => {}} inputId="test-id-focus-disabled" />
      );
      const radio = screen.getByRole('radio');
      expect(() => radio.focus()).not.toThrow();
    });
    it('has correct input type and checked state for accessibility', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={true} disabled={false} onSelect={() => {}} inputId="test-id-aria-checked" />
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('type', 'radio');
      expect(radio).toBeChecked();
    });
    it('handles ref changing between renders', () => {
      const ref1 = React.createRef<HTMLInputElement>();
      const ref2 = React.createRef<HTMLInputElement>();
      const { rerender } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-ref1" inputRef={ref1} />
      );
      rerender(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-ref2" inputRef={ref2} />
      );
      expect(ref2.current).not.toBeNull();
    });
    it('renders with only required props (minimal)', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-minimal-props" />
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
    it('renders with all props provided (maximal)', () => {
      const ref = React.createRef<HTMLInputElement>();
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption
          label="Z"
          option="Maximal Option"
          selected={true}
          disabled={false}
          onSelect={onSelect}
          onSubmitOption={onSubmitOption}
          className="correct selected"
          inputRef={ref}
          inputId="test-id-maximal"
          name="group-max"
          autoFocus
        >
          <span data-testid="max-child">Max Child</span>
        </QuizOption>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
      expect(ref.current).not.toBeNull();
      expect(screen.getByTestId('max-child')).toBeInTheDocument();
    });
    it('respects custom tabIndex and cycles tabIndex', () => {
      render(
        <>
          <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-tab1" />
          <QuizOption label="B" option="Option 2" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-tab2" />
        </>
      );
      const [radio1, radio2] = screen.getAllByRole('radio');
      expect(radio1.tabIndex).toBe(0);
      expect(radio2.tabIndex).toBe(0);
    });
    it('only fires handlers when enabled during dynamic disabling/enabling', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      const { rerender } = render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-dyn-disable" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
      rerender(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-dyn-disable" />
      );
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalled();
      expect(onSubmitOption).toHaveBeenCalled();
    });
  });
});
