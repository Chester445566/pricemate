import React from 'react';

// Common props for both input and select elements.
interface BaseFieldProps {
  label: string;
  id?: string;
  className?: string;
  helpText?: string;
}

// Props specific to a standard <input> element.
type InputFieldPropsType = BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement> & {
  as?: 'input';
};

// Props specific to a <select> element. `children` are required for the <option>s.
type SelectFieldPropsType = BaseFieldProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  as: 'select';
  children: React.ReactNode;
};

// A discriminated union type that ensures correct props are used for each element type.
type InputFieldProps = InputFieldPropsType | SelectFieldPropsType;

/**
 * A versatile and type-safe form field component that can render either an <input> or a <select> element.
 * It uses a discriminated union for its props to ensure type safety.
 *
 * @example
 * // Renders a text input with help text
 * <InputField label="Name" name="name" type="text" helpText="Please enter your full name." />
 *
 * @example
 * // Renders a select dropdown
 * <InputField label="Category" name="category" as="select">
 *   <option value="a">A</option>
 *   <option value="b">B</option>
 * </InputField>
 */
const InputField: React.FC<InputFieldProps> = (props) => {
  const { label, id, className, helpText } = props;

  const commonClasses = "w-full h-12 px-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:border-cyan-500 dark:focus:ring-offset-slate-900";

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      {/* Based on the 'as' prop, render either a select or an input.
          TypeScript can correctly infer the type of `props` within each branch. */}
      {props.as === 'select' ? (
        <select {...props} id={id} className={`${commonClasses} ${className}`}>
          {props.children}
        </select>
      ) : (
        <input {...props} id={id} className={`${commonClasses} ${className}`} />
      )}
      {helpText && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default InputField;