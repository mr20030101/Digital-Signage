import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { layoutAPI, regionAPI, playlistAPI, contentAPI } from '../services/api';
import MediaPicker from '../components/MediaPicker';

function LayoutDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [regions, setRegions] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [contents, setContents] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    fetchLayout();
    fetchPlaylists();
    fetchContents();
  }, [id]);

  const fetchLayout = async () => {
    try {
      const response = await layoutAPI.getOne(id);
      setLayout(response.data);
      setRegions(response.data.regions || []);
    } catch (error) {
      console.error('Error fetching layout:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await playlistAPI.getAll();
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchContents = async () => {
    try {
      const response = await contentAPI.getAll();
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const addRegion = () => {
    const newRegion = {
      id: Date.now(),
      name: `Region ${regions.length + 1}`,
      width: 300,
      height: 200,
      top: 100,
      left: 100,
      z_index: regions.length + 1,
      playlist_id: null,
      content_id: null,
      isNew: true,
    };
    setRegions([...regions, newRegion]);
    setSelectedRegion(newRegion);
  };

  const updateRegion = (id, updates) => {
    setRegions(regions.map(r => r.id === id ? { ...r, ...updates } : r));
    if (selectedRegion?.id === id) {
      setSelectedRegion({ ...selectedRegion, ...updates });
    }
  };

  const deleteRegion = (id) => {
    setRegions(regions.filter(r => r.id !== id));
    if (selectedRegion?.id === id) {
      setSelectedRegion(null);
    }
  };

  const handleMouseDown = (e, region) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRegion(region);
    setDragging(region.id);
    
    const canvas = document.getElementById('layout-canvas');
    const rect = canvas.getBoundingClientRect();
    const regionRect = e.currentTarget.getBoundingClientRect();
    
    // Store offset from mouse to region's top-left corner
    setDragOffset({
      x: e.clientX - regionRect.left,
      y: e.clientY - regionRect.top,
    });
  };

  const handleResizeStart = (e, region, handle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRegion(region);
    setResizing({ id: region.id, handle });
    setResizeStart({
      width: region.width,
      height: region.height,
      top: region.top,
      left: region.left,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  const handleMouseMove = (e) => {
    if (!layout) return;
    const canvas = document.getElementById('layout-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / layout.width; // Calculate actual scale

    // Handle dragging
    if (dragging && !resizing) {
      // Calculate new position in pixels
      let left = (e.clientX - rect.left - dragOffset.x) / scale;
      let top = (e.clientY - rect.top - dragOffset.y) / scale;
      
      // Get the region being dragged to constrain properly
      const region = regions.find(r => r.id === dragging);
      if (!region) return;
      
      // Constrain to canvas bounds (accounting for region size)
      left = Math.max(0, Math.min(layout.width - region.width, left));
      top = Math.max(0, Math.min(layout.height - region.height, top));
      
      updateRegion(dragging, { left: Math.round(left), top: Math.round(top) });
    }

    // Handle resizing
    if (resizing) {
      const region = regions.find(r => r.id === resizing.id);
      if (!region) return;

      const deltaX = (e.clientX - resizeStart.mouseX) / scale;
      const deltaY = (e.clientY - resizeStart.mouseY) / scale;

      let updates = {};

      switch (resizing.handle) {
        case 'se': // Bottom-right
          updates.width = Math.max(50, Math.min(layout.width - region.left, resizeStart.width + deltaX));
          updates.height = Math.max(50, Math.min(layout.height - region.top, resizeStart.height + deltaY));
          break;
        case 'sw': // Bottom-left
          updates.width = Math.max(50, Math.min(resizeStart.left + resizeStart.width, resizeStart.width - deltaX));
          updates.height = Math.max(50, Math.min(layout.height - region.top, resizeStart.height + deltaY));
          updates.left = Math.max(0, resizeStart.left + deltaX);
          if (updates.width === 50) updates.left = region.left;
          break;
        case 'ne': // Top-right
          updates.width = Math.max(50, Math.min(layout.width - region.left, resizeStart.width + deltaX));
          updates.height = Math.max(50, Math.min(resizeStart.top + resizeStart.height, resizeStart.height - deltaY));
          updates.top = Math.max(0, resizeStart.top + deltaY);
          if (updates.height === 50) updates.top = region.top;
          break;
        case 'nw': // Top-left
          updates.width = Math.max(50, Math.min(resizeStart.left + resizeStart.width, resizeStart.width - deltaX));
          updates.height = Math.max(50, Math.min(resizeStart.top + resizeStart.height, resizeStart.height - deltaY));
          updates.left = Math.max(0, resizeStart.left + deltaX);
          updates.top = Math.max(0, resizeStart.top + deltaY);
          if (updates.width === 50) updates.left = region.left;
          if (updates.height === 50) updates.top = region.top;
          break;
        case 'e': // Right edge
          updates.width = Math.max(50, Math.min(layout.width - region.left, resizeStart.width + deltaX));
          break;
        case 'w': // Left edge
          updates.width = Math.max(50, Math.min(resizeStart.left + resizeStart.width, resizeStart.width - deltaX));
          updates.left = Math.max(0, resizeStart.left + deltaX);
          if (updates.width === 50) updates.left = region.left;
          break;
        case 's': // Bottom edge
          updates.height = Math.max(50, Math.min(layout.height - region.top, resizeStart.height + deltaY));
          break;
        case 'n': // Top edge
          updates.height = Math.max(50, Math.min(resizeStart.top + resizeStart.height, resizeStart.height - deltaY));
          updates.top = Math.max(0, resizeStart.top + deltaY);
          if (updates.height === 50) updates.top = region.top;
          break;
      }

      // Round to integers
      Object.keys(updates).forEach(key => {
        updates[key] = Math.round(updates[key]);
      });

      updateRegion(resizing.id, updates);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, dragOffset, resizeStart, regions, layout]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedRegion || !layout) return;
      
      // Check if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      const step = e.shiftKey ? 10 : 1; // Hold Shift for larger steps (10px vs 1px)
      let updates = {};

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          updates.top = Math.max(0, selectedRegion.top - step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          updates.top = Math.min(layout.height - selectedRegion.height, selectedRegion.top + step);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updates.left = Math.max(0, selectedRegion.left - step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          updates.left = Math.min(layout.width - selectedRegion.width, selectedRegion.left + step);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteRegion(selectedRegion.id);
          break;
        default:
          return;
      }

      if (Object.keys(updates).length > 0) {
        updateRegion(selectedRegion.id, updates);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRegion, regions, layout]);

  const saveLayout = async () => {
    try {
      // Save all regions
      for (const region of regions) {
        if (region.isNew) {
          // Remove temporary properties before sending to backend
          const { id: tempId, isNew, ...regionData } = region;
          await regionAPI.create({
            ...regionData,
            layout_id: parseInt(id), // id from useParams (layout ID)
          });
        } else {
          // Remove temporary properties before sending to backend
          const { isNew, ...regionData } = region;
          await regionAPI.update(region.id, regionData);
        }
      }
      alert('Layout saved successfully!');
      navigate('/layouts');
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Error saving layout: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!layout) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>;
  }

  const scale = 0.5; // Scale down for preview

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/layouts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-heading text-gray-900">{layout.name}</h1>
            <p className="text-sm text-gray-600 font-body">{layout.width} × {layout.height}px</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addRegion}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-body font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Region
          </button>
          <button
            onClick={saveLayout}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-body font-semibold"
          >
            Save Layout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Canvas */}
        <div className="flex-1 p-8 overflow-auto bg-gray-100">
          <div className="flex items-center justify-center min-h-full">
            <div
              id="layout-canvas"
              className="relative bg-black shadow-2xl"
              style={{
                width: layout.width * scale,
                height: layout.height * scale,
              }}
            >
              {regions.map(region => {
                const content = region.content_id ? contents.find(c => c.id === region.content_id) : null;
                
                return (
                  <div
                    key={region.id}
                    onMouseDown={(e) => handleMouseDown(e, region)}
                    onClick={() => setSelectedRegion(region)}
                    className={`absolute border-2 cursor-move transition-none overflow-hidden ${
                      selectedRegion?.id === region.id
                        ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                        : 'border-white border-opacity-50 bg-white bg-opacity-10 hover:border-opacity-100'
                    }`}
                    style={{
                      width: `${region.width * scale}px`,
                      height: `${region.height * scale}px`,
                      top: `${region.top * scale}px`,
                      left: `${region.left * scale}px`,
                      zIndex: region.z_index,
                    }}
                  >
                    {/* Media Preview */}
                    {content && (
                      <div className="absolute inset-0 pointer-events-none">
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
                        ) : null}
                      </div>
                    )}

                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-2 py-1 font-body pointer-events-none z-10">
                      {region.name}
                    </div>
                    
                    {/* Resize handles - only show when selected */}
                    {selectedRegion?.id === region.id && (
                      <>
                        {/* Corner handles */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'nw')}
                          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize z-10"
                        />
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'ne')}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize z-10"
                        />
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'sw')}
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize z-10"
                        />
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'se')}
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize z-10"
                        />
                        
                        {/* Edge handles */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'n')}
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-n-resize z-10"
                        />
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 's')}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-s-resize z-10"
                        />
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'w')}
                          className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-w-resize z-10"
                        />
                        <div
                          onMouseDown={(e) => handleResizeStart(e, region, 'e')}
                          className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-e-resize z-10"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating Properties Panel - Vertical */}
        {selectedRegion && (
          <div className="fixed top-1/2 -translate-y-1/2 right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 w-80 animate-slide-left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-heading text-gray-900">Region Properties</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteRegion(selectedRegion.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete region"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={selectedRegion.name}
                  onChange={(e) => updateRegion(selectedRegion.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={selectedRegion.width}
                    onChange={(e) => updateRegion(selectedRegion.id, { width: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                    min="1"
                    max={layout?.width}
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={selectedRegion.height}
                    onChange={(e) => updateRegion(selectedRegion.id, { height: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                    min="1"
                    max={layout?.height}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Top (px)</label>
                  <input
                    type="number"
                    value={selectedRegion.top}
                    onChange={(e) => updateRegion(selectedRegion.id, { top: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                    min="0"
                    max={layout?.height}
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Left (px)</label>
                  <input
                    type="number"
                    value={selectedRegion.left}
                    onChange={(e) => updateRegion(selectedRegion.id, { left: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                    min="0"
                    max={layout?.width}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Z-Index</label>
                <input
                  type="number"
                  value={selectedRegion.z_index}
                  onChange={(e) => updateRegion(selectedRegion.id, { z_index: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Media Assignment</label>
                
                {/* Playlist Selection */}
                <div className="mb-3">
                  <label className="block text-xs font-body font-semibold text-gray-500 mb-1">Playlist (Multiple Files)</label>
                  <select
                    value={selectedRegion.playlist_id || ''}
                    onChange={(e) => updateRegion(selectedRegion.id, { 
                      playlist_id: e.target.value ? parseInt(e.target.value) : null,
                      content_id: null 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                  >
                    <option value="">No playlist</option>
                    {playlists.map(playlist => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Selection */}
                <div>
                  <label className="block text-xs font-body font-semibold text-gray-500 mb-1">Single File</label>
                  <button
                    onClick={() => setShowMediaPicker(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm text-left flex items-center justify-between transition-colors"
                  >
                    <span className={selectedRegion.content_id ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedRegion.content_id 
                        ? contents.find(c => c.id === selectedRegion.content_id)?.name || 'Select file...'
                        : 'Select file...'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {selectedRegion.content_id && (
                    <button
                      onClick={() => updateRegion(selectedRegion.id, { content_id: null })}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 font-body"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-body text-blue-900 mb-2 font-semibold">Keyboard Shortcuts</p>
                <div className="text-xs font-body text-blue-700 space-y-1">
                  <div>Arrow keys: Move (1px)</div>
                  <div>Shift + Arrows: Move (10px)</div>
                  <div>Delete/Backspace: Remove</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(content) => {
          if (content) {
            updateRegion(selectedRegion.id, { 
              content_id: content.id,
              playlist_id: null 
            });
          } else {
            updateRegion(selectedRegion.id, { content_id: null });
          }
          setShowMediaPicker(false);
        }}
        selectedId={selectedRegion?.content_id}
      />
    </div>
  );
}

export default LayoutDesigner;
