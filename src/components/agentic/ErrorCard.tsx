import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorCardProps {
  content: string;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ content }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-4 h-4 text-red-600" />
      <span className="font-medium text-red-900">Error</span>
    </div>
    <div className="text-sm text-red-800 whitespace-pre-wrap">{content}</div>
  </div>
);

export default ErrorCard;
