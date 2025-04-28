import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTimes, FaLock, FaEye, FaGlobe } from 'react-icons/fa';
import { Deck } from '../../app/store/slices/deck.slice';
import './DeckForm.scss';

interface DeckFormProps {
  initialValues?: Partial<Deck>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const validationSchema = Yup.object({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .required('Title is required'),
  description: Yup.string().max(500, 'Description cannot exceed 500 characters'),
  tags: Yup.array().of(Yup.string()),
  visibility: Yup.string().oneOf(['private', 'shared', 'public']).required('Visibility is required'),
  settings: Yup.object({
    newCardsPerDay: Yup.number()
      .min(1, 'Must be at least 1')
      .max(100, 'Cannot exceed 100')
      .integer('Must be a whole number'),
    reviewsPerDay: Yup.number()
      .min(1, 'Must be at least 1')
      .max(1000, 'Cannot exceed 1000')
      .integer('Must be a whole number'),
  }),
});

const DeckForm: React.FC<DeckFormProps> = ({ 
  initialValues, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}) => {
  const [tagInput, setTagInput] = useState('');

  const defaultValues = {
    title: '',
    description: '',
    tags: [],
    visibility: 'private',
    coverImage: '',
    settings: {
      newCardsPerDay: 10,
      reviewsPerDay: 50,
      orderNewCards: 'order_added',
      orderReviews: 'due_date',
    },
    ...initialValues,
  };

  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    push: (value: string) => void,
    values: any
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !values.tags.includes(tag)) {
        push(tag);
        setTagInput('');
      }
    }
  };

  return (
    <div className="deck-form-container">
      <h2>{isEditing ? 'Edit Deck' : 'Create New Deck'}</h2>
      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, isSubmitting, setFieldValue }) => (
          <Form className="deck-form">
            <div className="form-group">
              <label htmlFor="title">Deck Title *</label>
              <Field
                type="text"
                id="title"
                name="title"
                placeholder="Enter a title for your deck"
                className="form-control"
              />
              <ErrorMessage name="title" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <Field
                as="textarea"
                id="description"
                name="description"
                placeholder="Describe what this deck is about"
                className="form-control"
                rows={4}
              />
              <ErrorMessage name="description" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="coverImage">Cover Image URL</label>
              <Field
                type="text"
                id="coverImage"
                name="coverImage"
                placeholder="https://example.com/image.jpg"
                className="form-control"
              />
              <ErrorMessage name="coverImage" component="div" className="error-message" />
              {values.coverImage && (
                <div className="image-preview">
                  <img src={values.coverImage} alt="Cover preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Tags</label>
              <FieldArray name="tags">
                {({ push, remove }) => (
                  <div>
                    <div className="tag-input-container">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => handleTagInputKeyDown(e, push, values)}
                        placeholder="Add a tag and press Enter"
                        className="form-control"
                      />
                      <button
                        type="button"
                        className="add-tag-btn"
                        onClick={() => {
                          const tag = tagInput.trim();
                          if (tag && !values.tags.includes(tag)) {
                            push(tag);
                            setTagInput('');
                          }
                        }}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <div className="tags-container">
                      {values.tags && values.tags.length > 0 ? (
                        values.tags.map((tag: string, index: number) => (
                          <div key={index} className="tag">
                            {tag}
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="remove-tag-btn"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="no-tags">No tags added yet</p>
                      )}
                    </div>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="form-group">
              <label>Visibility</label>
              <div className="visibility-options">
                <label className={`visibility-option ${values.visibility === 'private' ? 'selected' : ''}`}>
                  <Field
                    type="radio"
                    name="visibility"
                    value="private"
                    className="visibility-radio"
                  />
                  <FaLock className="visibility-icon" />
                  <div>
                    <h4>Private</h4>
                    <p>Only you can access this deck</p>
                  </div>
                </label>

                <label className={`visibility-option ${values.visibility === 'shared' ? 'selected' : ''}`}>
                  <Field
                    type="radio"
                    name="visibility"
                    value="shared"
                    className="visibility-radio"
                  />
                  <FaEye className="visibility-icon" />
                  <div>
                    <h4>Shared</h4>
                    <p>You can invite specific users to access this deck</p>
                  </div>
                </label>

                <label className={`visibility-option ${values.visibility === 'public' ? 'selected' : ''}`}>
                  <Field
                    type="radio"
                    name="visibility"
                    value="public"
                    className="visibility-radio"
                  />
                  <FaGlobe className="visibility-icon" />
                  <div>
                    <h4>Public</h4>
                    <p>Anyone can find and study this deck</p>
                  </div>
                </label>
              </div>
              <ErrorMessage name="visibility" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label>Advanced Settings</label>
              <div className="advanced-settings">
                <div className="setting-group">
                  <label htmlFor="settings.newCardsPerDay">New Cards Per Day</label>
                  <Field
                    type="number"
                    id="settings.newCardsPerDay"
                    name="settings.newCardsPerDay"
                    min={1}
                    max={100}
                    className="form-control"
                  />
                  <ErrorMessage name="settings.newCardsPerDay" component="div" className="error-message" />
                </div>

                <div className="setting-group">
                  <label htmlFor="settings.reviewsPerDay">Reviews Per Day</label>
                  <Field
                    type="number"
                    id="settings.reviewsPerDay"
                    name="settings.reviewsPerDay"
                    min={1}
                    max={1000}
                    className="form-control"
                  />
                  <ErrorMessage name="settings.reviewsPerDay" component="div" className="error-message" />
                </div>

                <div className="setting-group">
                  <label htmlFor="settings.orderNewCards">Order New Cards</label>
                  <Field
                    as="select"
                    id="settings.orderNewCards"
                    name="settings.orderNewCards"
                    className="form-control"
                  >
                    <option value="order_added">In order added</option>
                    <option value="random">Random</option>
                  </Field>
                </div>

                <div className="setting-group">
                  <label htmlFor="settings.orderReviews">Order Reviews</label>
                  <Field
                    as="select"
                    id="settings.orderReviews"
                    name="settings.orderReviews"
                    className="form-control"
                  >
                    <option value="due_date">By due date</option>
                    <option value="random">Random</option>
                    <option value="difficulty">By difficulty</option>
                  </Field>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onCancel} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="submit-btn">
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Deck' : 'Create Deck'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default DeckForm;
