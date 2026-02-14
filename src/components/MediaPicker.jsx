import { useState, useEffect } from 'react';
import { contentAPI } from '../services/api';

function MediaPicker({ isOpen, onClose, onSelect, selectedId }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, image, video

  useEffect(() => {
    if (isOpen) {
      fetchContents();
    }
  }, [isOpen]);

  const fetchContents = async () => {
    try {
      const response = await contentAPI.getAll();
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(content => {
    if (filter === 'all') return true;
    return content.type === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading text-gray-900">Select Media</h2>
            <p className="text-sm text-gray-600 font-body">Choose a file from your library</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-body font-semibold text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Files ({contents.length})
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-4 py-2 rounded-lg font-body font-semibold text-sm transition-colors ${
                filter === 'image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Images ({contents.filter(c => c.type === 'image').length})
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-4 py-2 rounded-lg font-body font-semibold text-sm transition-colors ${
                filter === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Videos ({contents.filter(c => c.type === 'video').length})
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="font-body">No {filter !== 'all' ? filter + 's' : 'files'} found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredContents.map(content => (
                <div
                  key={content.id}
                  onClick={() => onSelect(content)}
                  className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    selectedId === content.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    {content.type === 'video' && content.thumbnail_path ? (
                      <img
                        src={`http://localhost:8000/storage/${content.thumbnail_path}`}
                        alt={content.name}
                        className="w-full h-full object-cover"
                      />
                    ) : content.type === 'image' ? (
                      <img
                        src={`http://localhost:8000/storage/${content.file_path}`}
                        alt={content.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-sm font-body font-semibold text-gray-900 truncate">{content.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 font-body uppercase">{content.type}</span>
                      {content.duration && (
                        <span className="text-xs text-gray-500 font-body">{content.duration}s</span>
                      )}
                    </div>
                  </div>
                  {selectedId === content.id && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-body font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(null)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-body font-semibold"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPicker;
