import React from 'react';
import { Lightbulb } from 'lucide-react';

interface SuggestionCardProps {
  content: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ content }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <Lightbulb className="w-4 h-4 text-blue-600" />
      <span className="font-medium text-blue-900">Suggestions</span>
    </div>
    <div className="text-sm text-blue-800 whitespace-pre-wrap">{content}</div>
  </div>
);

export default SuggestionCard;
