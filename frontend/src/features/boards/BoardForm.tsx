import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import Button from '../../components/Button/Button';

import {
  boardSchema,
  type BoardFormValues,
} from './boardSchema';

import './BoardForm.scss';

type BoardFormProps = {
  defaultValues: BoardFormValues;
  submitLabel: string;
  onSubmit: (
    values: BoardFormValues,
  ) => void;
  onCancel: () => void;
};

function BoardForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: BoardFormProps) {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<BoardFormValues>({
    resolver:
      zodResolver(boardSchema),
    defaultValues,
  });

  function submitForm(
    values: BoardFormValues,
  ) {
    onSubmit({
      name: values.name.trim(),
      description:
        values.description.trim(),
    });
  }

  return (
    <form
      className="board-form"
      onSubmit={handleSubmit(
        submitForm,
      )}
    >
      <div className="board-form__field">
        <label
          className="board-form__label"
          htmlFor="board-name"
        >
          Board name
        </label>

        <input
          id="board-name"
          className="board-form__input"
          type="text"
          placeholder="Enter board name"
          autoFocus
          {...register('name')}
        />

        {errors.name && (
          <p className="board-form__error">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="board-form__field">
        <label
          className="board-form__label"
          htmlFor="board-description"
        >
          Description
        </label>

        <textarea
          id="board-description"
          className="board-form__textarea"
          rows={5}
          placeholder="Describe your board"
          {...register(
            'description',
          )}
        />

        {errors.description && (
          <p className="board-form__error">
            {
              errors.description
                .message
            }
          </p>
        )}
      </div>

      <div className="board-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default BoardForm;