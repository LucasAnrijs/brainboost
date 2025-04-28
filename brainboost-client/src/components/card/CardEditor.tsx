import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaChevronDown, FaChevronUp, FaImage, FaVolumeUp, FaCode, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';
import { CardWithState } from '../../app/store/slices/card.slice';
import './CardEditor.scss';

interface CardEditorProps {
  initialValues?: Partial<CardWithState>;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
  deckTags?: string[];
}

const validationSchema = Yup.object({
  content: Yup.object({
    front: Yup.object({
      text: Yup.string()
        .required('Front side content is required')
        .max(5000, 'Front side content is too long (max 5000 characters)'),
    }),
    back: Yup.object({
      text: Yup.string()
        .required('Back side content is required')
        .max(5000, 'Back side content is too long (max 5000 characters)'),
    }),
  }),
  tags: Yup.array().of(Yup.string()),
  type: Yup.string().oneOf(['standard', 'cloze', 'image_occlusion', 'multiple_choice', 'true_false']),
  notes: Yup.string().max(1000, 'Notes cannot exceed 1000 characters'),
});

const CardEditor: React.FC<CardEditorProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isEditing = false,
  deckTags = [],
}) => {
  const [tagInput, setTagInput] = useState('');
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);

  const defaultValues = {
    content: {
      front: {
        text: '',
        media: [],
        formatting: {},
      },
      back: {
        text: '',
        media: [],
        formatting: {},
      },
    },
    tags: [],
    type: 'standard',
    notes: '',
    ...initialValues,
  };

  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void,
    values: any
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !values.tags.includes(tag)) {
        setFieldValue('tags', [...values.tags, tag]);
        setTagInput('');
      }
    }
  };

  const addTag = (
    tag: string,
    setFieldValue: (field: string, value: any) => void,
    values: any
  ) => {
    if (tag && !values.tags.includes(tag)) {
      setFieldValue('tags', [...values.tags, tag]);
      setTagInput('');
    }
  };

  return (
    <div className="card-editor">
      <h2>{isEditing ? 'Edit Card' : 'Create New Card'}</h2>
      
      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, isSubmitting, setFieldValue }) => (
          <Form className="card-form">
            <div className="card-preview">
              <div className="card-side front">
                <div className="card-side-label">Front</div>
                <div className="card-content">
                  <Field
                    as="textarea"
                    name="content.front.text"
                    placeholder="Enter front side content..."
                    className="card-content-textarea"
                    rows={5}
                  />
                  <div className="content-tools">
                    <button type="button" className="tool-btn">
                      <FaImage /> Add Image
                    </button>
                    <button type="button" className="tool-btn">
                      <FaVolumeUp /> Add Audio
                    </button>
                    <button type="button" className="tool-btn">
                      <FaCode /> Add Equation
                    </button>
                    <div className="alignment-tools">
                      <button 
                        type="button" 
                        className={`tool-btn ${values.content.front.formatting?.align === 'left' ? 'active' : ''}`}
                        onClick={() => setFieldValue('content.front.formatting.align', 'left')}
                      >
                        <FaAlignLeft />
                      </button>
                      <button 
                        type="button" 
                        className={`tool-btn ${values.content.front.formatting?.align === 'center' ? 'active' : ''}`}
                        onClick={() => setFieldValue('content.front.formatting.align', 'center')}
                      >
                        <FaAlignCenter />
                      </button>
                      <button 
                        type="button" 
                        className={`tool-btn ${values.content.front.formatting?.align === 'right' ? 'active' : ''}`}
                        onClick={() => setFieldValue('content.front.formatting.align', 'right')}
                      >
                        <FaAlignRight />
                      </button>
                    </div>
                  </div>
                  <ErrorMessage name="content.front.text" component="div" className="error-message" />
                </div>
              </div>
              
              <div className="card-side back">
                <div className="card-side-label">Back</div>
                <div className="card-content">
                  <Field
                    as="textarea"
                    name="content.back.text"
                    placeholder="Enter back side content..."
                    className="card-content-textarea"
                    rows={5}
                  />
                  <div className="content-tools">
                    <button type="button" className="tool-btn">
                      <FaImage /> Add Image
                    </button>
                    <button type="button" className="tool-btn">
                      <FaVolumeUp /> Add Audio
                    </button>
                    <button type="button" className="tool-btn">
                      <FaCode /> Add Equation
                    </button>
                    <div className="alignment-tools">
                      <button 
                        type="button" 
                        className={`tool-btn ${values.content.back.formatting?.align === 'left' ? 'active' : ''}`}
                        onClick={() => setFieldValue('content.back.formatting.align', 'left')}
                      >
                        <FaAlignLeft />
                      </button>
                      <button 
                        type="button" 
                        className={`tool-btn ${values.content.back.formatting?.align === 'center' ? 'active' : ''}`}
                        onClick={() => setFieldValue('content.back.formatting.align', 'center')}
                      >
                        <FaAlignCenter />
                      </button>
                      <button 
                        type="button" 
                        className={`tool-btn ${values.content.back.formatting?.align === 'right' ? 'active' : ''}`}
                        onClick={() => setFieldValue('content.back.formatting.align', 'right')}
                      >
                        <FaAlignRight />
                      </button>
                    </div>
                  </div>
                  <ErrorMessage name="content.back.text" component="div" className="error-message" />
                </div>
              </div>
            </div>
            
            <div className="card-options">
              <div className="tags-section">
                <label>Tags</label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => handleTagInputKeyDown(e, setFieldValue, values)}
                    placeholder="Add tags to organize your cards"
                    className="tag-input"
                  />
                  <button
                    type="button"
                    className="add-tag-btn"
                    onClick={() => addTag(tagInput.trim(), setFieldValue, values)}
                  >
                    Add
                  </button>
                </div>
                
                {deckTags.length > 0 && (
                  <div className="deck-tags">
                    <span className="deck-tags-label">Deck tags:</span>
                    {deckTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="deck-tag"
                        onClick={() => addTag(tag, setFieldValue, values)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="tags-container">
                  {values.tags && values.tags.length > 0 ? (
                    values.tags.map((tag: string, index: number) => (
                      <div key={index} className="tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            setFieldValue(
                              'tags',
                              values.tags.filter((_: any, i: number) => i !== index)
                            );
                          }}
                          className="remove-tag-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-tags">No tags added</div>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setAdvancedOptionsOpen(!advancedOptionsOpen)}
              >
                {advancedOptionsOpen ? (
                  <>
                    <FaChevronUp /> Hide Advanced Options
                  </>
                ) : (
                  <>
                    <FaChevronDown /> Show Advanced Options
                  </>
                )}
              </button>
              
              {advancedOptionsOpen && (
                <div className="advanced-options">
                  <div className="option-group">
                    <label htmlFor="type">Card Type</label>
                    <Field as="select" name="type" className="select-input">
                      <option value="standard">Standard</option>
                      <option value="cloze">Cloze Deletion</option>
                      <option value="image_occlusion">Image Occlusion</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                    </Field>
                  </div>
                  
                  <div className="option-group">
                    <label htmlFor="notes">Personal Notes</label>
                    <Field
                      as="textarea"
                      name="notes"
                      placeholder="Add personal notes about this card (not shown during review)"
                      className="notes-textarea"
                      rows={3}
                    />
                    <ErrorMessage name="notes" component="div" className="error-message" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={onCancel} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="submit-btn">
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Card' : 'Create Card'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CardEditor;
