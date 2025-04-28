import React, { useState } from 'react';
import { FaSave, FaUpload, FaQuestion, FaFileAlt, FaTable } from 'react-icons/fa';
import './BulkCardCreator.scss';

interface BulkCardCreatorProps {
  onSubmit: (cards: any[]) => void;
  onCancel: () => void;
  deckId: string;
}

const BulkCardCreator: React.FC<BulkCardCreatorProps> = ({ onSubmit, onCancel, deckId }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'csv' | 'help'>('text');
  const [textInput, setTextInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSeparatorVisible, setIsSeparatorVisible] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle text input change
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    
    // Auto-detect if the separator should be visible based on the format used
    const inputText = e.target.value.trim();
    const lines = inputText.split('\n').filter(line => line.trim());
    let hasSeparator = false;
    
    // Check the first few lines (max 5) to see if they have separators
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].includes(';;') || lines[i].includes('::') || lines[i].includes('>>')) {
        hasSeparator = true;
        break;
      }
    }
    
    setIsSeparatorVisible(hasSeparator);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCsvFile(file);
      setFileName(file.name);
    }
  };

  // Process text input to create cards
  const processTextInput = () => {
    setError('');
    setIsProcessing(true);
    
    try {
      const lines = textInput.trim().split('\n').filter(line => line.trim());
      const processedCards = [];
      
      // Try different separators
      for (let i = 0; i < lines.length; i++) {
        let front, back;
        let line = lines[i].trim();
        
        // Try different separators: ;;, ::, >>
        if (line.includes(';;')) {
          [front, back] = line.split(';;').map(part => part.trim());
        } else if (line.includes('::')) {
          [front, back] = line.split('::').map(part => part.trim());
        } else if (line.includes('>>')) {
          [front, back] = line.split('>>').map(part => part.trim());
        } else {
          // If current line has no separator, check if it's part of a pair
          if (i < lines.length - 1 && lines[i + 1].trim() && !isSeparatorVisible) {
            front = line;
            back = lines[i + 1].trim();
            i++; // Skip the next line as we've used it
          } else {
            // Standalone line without a clear separator
            if (isSeparatorVisible) {
              throw new Error(`Line ${i + 1} has no separator. Use ;; or :: or >> to separate front and back of the card.`);
            } else {
              // When in paired mode, each lone line is treated as front with empty back
              front = line;
              back = '';
            }
          }
        }
        
        if (front) {
          processedCards.push({
            content: {
              front: {
                text: front,
                media: [],
                formatting: {}
              },
              back: {
                text: back || '',
                media: [],
                formatting: {}
              }
            },
            type: 'standard',
            tags: []
          });
        }
      }
      
      if (processedCards.length === 0) {
        throw new Error('No valid cards found. Please check your input format.');
      }
      
      setCards(processedCards);
      setIsProcessing(false);
      return processedCards;
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message);
      return [];
    }
  };

  // Process CSV file to create cards
  const processCSVFile = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first.');
      return [];
    }
    
    setError('');
    setIsProcessing(true);
    
    try {
      // Read the CSV file content
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(csvFile);
      });
      
      // Parse CSV
      const lines = text.split('\n').filter(line => line.trim());
      const processedCards = [];
      
      // Check if there's a header row
      let startIndex = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('front') && firstLine.includes('back')) {
        startIndex = 1; // Skip header row
      }
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle quoted values properly
        let values: string[] = [];
        let inQuote = false;
        let currentValue = '';
        let delimiter = line.includes(',') ? ',' : '\t'; // Auto-detect CSV or TSV
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === delimiter && !inQuote) {
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue); // Add the last value
        
        // Clean up values (remove quotes, etc.)
        values = values.map(val => {
          let v = val.trim();
          if (v.startsWith('"') && v.endsWith('"')) {
            v = v.substring(1, v.length - 1);
          }
          return v;
        });
        
        if (values.length >= 2) {
          const front = values[0];
          const back = values[1];
          let tags: string[] = [];
          
          // Check if there's a third column for tags
          if (values.length >= 3 && values[2]) {
            tags = values[2].split(';').map(tag => tag.trim()).filter(Boolean);
          }
          
          processedCards.push({
            content: {
              front: {
                text: front,
                media: [],
                formatting: {}
              },
              back: {
                text: back,
                media: [],
                formatting: {}
              }
            },
            type: 'standard',
            tags: tags
          });
        }
      }
      
      if (processedCards.length === 0) {
        throw new Error('No valid cards found in the CSV file. Please check the format.');
      }
      
      setCards(processedCards);
      setIsProcessing(false);
      return processedCards;
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Error processing CSV file');
      return [];
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedCards: any[] = [];
    
    if (activeTab === 'text') {
      processedCards = processTextInput();
    } else if (activeTab === 'csv') {
      processedCards = await processCSVFile();
    }
    
    if (processedCards.length > 0) {
      onSubmit(processedCards);
    }
  };

  return (
    <div className="bulk-card-creator">
      <h2>Bulk Add Cards</h2>
      
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          <FaFileAlt /> Text Input
        </button>
        <button
          className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          <FaTable /> CSV Upload
        </button>
        <button
          className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`}
          onClick={() => setActiveTab('help')}
        >
          <FaQuestion /> Help
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="tab-content">
          {activeTab === 'text' && (
            <div className="text-input-tab">
              <p className="tab-description">
                Enter one card per line. Separate front and back sides with ;; or :: or >>
              </p>
              
              <div className="input-group">
                <label>
                  <input
                    type="checkbox"
                    checked={!isSeparatorVisible}
                    onChange={() => setIsSeparatorVisible(!isSeparatorVisible)}
                  />
                  <span>Pair mode (front and back are on separate lines)</span>
                </label>
                
                <textarea
                  value={textInput}
                  onChange={handleTextInputChange}
                  placeholder={isSeparatorVisible ? 
                    "What is the capital of France? ;; Paris\nWho wrote Hamlet? ;; William Shakespeare" :
                    "What is the capital of France?\nParis\nWho wrote Hamlet?\nWilliam Shakespeare"}
                  className="bulk-textarea"
                  rows={10}
                  required
                />
              </div>
              
              <div className="example-format">
                <h4>Example format:</h4>
                {isSeparatorVisible ? (
                  <pre>{`Front side of card ;; Back side of card
Another question :: Another answer
Third question >> Third answer`}</pre>
                ) : (
                  <pre>{`Front side of card
Back side of card
Another question
Another answer`}</pre>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'csv' && (
            <div className="csv-upload-tab">
              <p className="tab-description">
                Upload a CSV file with front and back sides in columns
              </p>
              
              <div className="file-upload-container">
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  id="csv-file-input"
                  className="file-input"
                />
                <label htmlFor="csv-file-input" className="file-input-label">
                  <FaUpload /> Select CSV File
                </label>
                <span className="file-name">{fileName || 'No file selected'}</span>
              </div>
              
              <div className="example-format">
                <h4>Expected CSV format:</h4>
                <pre>{`Front,Back,Tags
"What is the capital of France?","Paris","geography;europe"
"Who wrote Hamlet?","William Shakespeare","literature;play"`}</pre>
                <p className="note">* Tags column is optional. Multiple tags can be separated by semicolons.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'help' && (
            <div className="help-tab">
              <h3>How to Bulk Add Cards</h3>
              
              <h4>Text Input Method</h4>
              <p>
                You can add multiple cards at once by entering them in the text box, with one card per line.
                There are two ways to format your input:
              </p>
              <ol>
                <li>
                  <strong>With separators:</strong> Use ;; or :: or >> to separate the front and back sides.
                  <br />
                  <code>What is the capital of France? ;; Paris</code>
                </li>
                <li>
                  <strong>Pair mode:</strong> Put the front and back sides on consecutive lines.
                  <br />
                  <code>What is the capital of France?<br />Paris</code>
                </li>
              </ol>
              
              <h4>CSV Upload Method</h4>
              <p>
                Upload a CSV (Comma-Separated Values) file with the following structure:
              </p>
              <ul>
                <li>The first column contains the front side text.</li>
                <li>The second column contains the back side text.</li>
                <li>An optional third column can contain tags, separated by semicolons.</li>
                <li>A header row is optional but recommended.</li>
              </ul>
              <p>
                Both CSV (comma-separated) and TSV (tab-separated) formats are supported.
              </p>
              
              <h4>Tips for Successful Import</h4>
              <ul>
                <li>Keep each card entry simple and focused.</li>
                <li>For complex formatting, create cards individually using the card editor.</li>
                <li>Review your cards after import to ensure they've been created correctly.</li>
                <li>Maximum 500 cards per import.</li>
              </ul>
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="card-preview">
          {cards.length > 0 && (
            <>
              <h3>{cards.length} Cards Ready to Import</h3>
              <div className="preview-list">
                {cards.slice(0, 3).map((card, index) => (
                  <div key={index} className="preview-card">
                    <div className="preview-front">{card.content.front.text}</div>
                    <div className="preview-separator"></div>
                    <div className="preview-back">{card.content.back.text}</div>
                  </div>
                ))}
                {cards.length > 3 && (
                  <div className="more-cards">
                    +{cards.length - 3} more cards
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={isProcessing || (activeTab === 'text' && !textInput.trim()) || (activeTab === 'csv' && !csvFile)}
          >
            <FaSave /> {isProcessing ? 'Processing...' : 'Create Cards'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkCardCreator;
