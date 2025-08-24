import React from 'react';
import { getQuoteOfDay } from '../../utils/helpers';

const QuoteOfDay = () => {
  const quote = getQuoteOfDay();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-base sm:text-lg font-semibold text-rose-600 mb-2">
          Quote of the Day
        </h2>
        <p className="text-sm sm:text-base text-gray-700 italic">{quote}</p>
      </div>
    </div>
  );
};

export default QuoteOfDay;
