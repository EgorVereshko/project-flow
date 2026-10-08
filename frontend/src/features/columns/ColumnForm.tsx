import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import Button from '../../components/Button/Button';

import {
  columnSchema,
  type ColumnFormValues,
} from './columnSchema';

import './ColumnForm.scss';

type ColumnFormProps = {
  defaultValues: ColumnFormValues;
  submitLabel: string;
  onSubmit: (
    values: ColumnFormValues,
  ) => void;
  onCancel: () => void;
};

function ColumnForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ColumnFormProps) {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ColumnFormValues>({
    resolver: zodResolver(columnSchema),
    defaultValues,
  });

  function submitForm(
    values: ColumnFormValues,
  ) {
    onSubmit({
      title: values.title.trim(),
    });
  }

  return (
    <form
      className="column-form"
      onSubmit={handleSubmit(
        submitForm,
      )}
    >
      <div className="column-form__field">
        <label
          className="column-form__label"
          htmlFor="column-title"
        >
          Column name
        </label>

        <input
          id="column-title"
          className="column-form__input"
          type="text"
          placeholder="Enter column name"
          autoFocus
          {...register('title')}
        />

        {errors.title && (
          <p className="column-form__error">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="column-form__actions">
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

export default ColumnForm;