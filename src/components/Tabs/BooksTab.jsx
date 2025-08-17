// src/components/Tabs/BooksTab.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Search } from 'lucide-react';
import { dbFunctions } from '../../utils/database';

const BooksTab = ({ user }) => {
  const [myBooks, setMyBooks] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '' });
  const [recommendationTopic, setRecommendationTopic] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [user.uid]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const result = await dbFunctions.getUserDocuments('books', user.uid);
      
      if (result.success) {
        setMyBooks(result.documents);
      } else {
        console.error('Error loading books:', result.error);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock book recommendations (will be replaced with AI)
  const getRecommendations = () => {
    const mockRecommendations = {
      anxiety: [
        { title: "The Anxiety and Phobia Workbook", author: "Edmund Bourne" },
        { title: "Dare", author: "Barry McDonagh" },
        { title: "The Worry Trick", author: "David Carbonell" }
      ],
      happiness: [
        { title: "The Happiness Project", author: "Gretchen Rubin" },
        { title: "Stumbling on Happiness", author: "Daniel Gilbert" },
        { title: "The Art of Happiness", author: "Dalai Lama" }
      ],
      mindfulness: [
        { title: "Wherever You Go, There You Are", author: "Jon Kabat-Zinn" },
        { title: "The Power of Now", author: "Eckhart Tolle" },
        { title: "Mindfulness in Plain English", author: "Bhante Gunaratana" }
      ]
    };
    
    const topic = recommendationTopic.toLowerCase();
    const recs = mockRecommendations[topic] || [
      { title: "Atomic Habits", author: "James Clear" },
      { title: "The Body Keeps the Score", author: "Bessel van der Kolk" },
      { title: "Feeling Good", author: "David Burns" }
    ];
    
    setRecommendations(recs);
  };

  const addBook = async () => {
    if (!newBook.title || !newBook.author) {
      alert('Please enter both title and author');
      return;
    }
    
    try {
      const bookData = {
        userId: user.uid,
        title: newBook.title,
        author: newBook.author
      };
      
      const result = await dbFunctions.add('books', bookData);
      
      if (result.success) {
        setNewBook({ title: '', author: '' });
        await loadBooks();
      } else {
        alert('Error adding book. Please try again.');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Error adding book. Please try again.');
    }
  };

  const deleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to remove this book?')) return;
    
    try {
      const result = await dbFunctions.delete('books', bookId);
      
      if (result.success) {
        setMyBooks(myBooks.filter(book => book.id !== bookId));
      } else {
        alert('Error removing book. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error removing book. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">Get Book Recommendations</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={recommendationTopic}
            onChange={(e) => setRecommendationTopic(e.target.value)}
            placeholder="Enter mood or topic (e.g., anxiety, happiness)"
            className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
          <button
            onClick={getRecommendations}
            className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            <Search size={20} />
            Get Books
          </button>
        </div>
        
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Recommended for you:</h3>
            {recommendations.map((book, index) => (
              <div key={index} className="p-3 bg-rose-50 rounded-lg">
                <p className="font-medium">{book.title}</p>
                <p className="text-sm text-gray-600">by {book.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">My Reading List</h2>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="Book title"
            className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
          <input
            type="text"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            placeholder="Author"
            className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
          <button
            onClick={addBook}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading your books...</p>
        ) : myBooks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No books in your reading list yet. Add some above!
          </p>
        ) : (
          <div className="space-y-3">
            {myBooks.map((book) => (
              <div key={book.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-rose-500" size={20} />
                  <div>
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-gray-600">by {book.author}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteBook(book.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksTab;