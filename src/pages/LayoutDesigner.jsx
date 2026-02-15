import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { layoutAPI, regionAPI, playlistAPI, contentAPI } from '../services/api';
import MediaPicker from '../components/MediaPicker';
import Swal from 'sweetalert2';
import { QRCodeSVG } from 'qrcode.react';

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
      console.log('Layout API Response:', response.data);
      console.log('Regions from API:', response.data.regions);
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

  const deleteRegion = async (id) => {
    const region = regions.find(r => r.id === id);
    
    // Confirm deletion
    const result = await Swal.fire({
      title: 'Delete Region?',
      text: `Delete "${region?.name || 'this region'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    // If it's not a new region (exists in database), delete it from backend
    if (region && !region.isNew) {
      try {
        await regionAPI.delete(id);
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Region deleted successfully',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting region:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete region from database.'
        });
        return; // Don't remove from UI if backend delete failed
      }
    }
    
    // Remove from local state
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
      
      await Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Layout saved successfully',
        timer: 2000,
        showConfirmButton: false
      });
      
      navigate('/layouts');
    } catch (error) {
      console.error('Error saving layout:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Saving Layout',
        text: error.response?.data?.message || error.message
      });
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
                const hasWidget = region.widget_type && region.widget_config;
                
                // Debug logging
                if (region.widget_type) {
                  console.log('Region with widget:', {
                    id: region.id,
                    widget_type: region.widget_type,
                    widget_config: region.widget_config,
                    widget_config_type: typeof region.widget_config
                  });
                }
                
                return (
                  <div
                    key={region.id}
                    onMouseDown={(e) => handleMouseDown(e, region)}
                    onClick={() => setSelectedRegion(region)}
                    className={`absolute border-2 cursor-move transition-none overflow-hidden ${
                      selectedRegion?.id === region.id
                        ? 'border-blue-500'
                        : hasWidget || content
                        ? 'border-white border-opacity-50 hover:border-opacity-100'
                        : 'border-white border-opacity-50 bg-white bg-opacity-10 hover:border-opacity-100'
                    } ${selectedRegion?.id === region.id && !hasWidget && !content ? 'bg-blue-500 bg-opacity-20' : ''}`}
                    style={{
                      width: `${region.width * scale}px`,
                      height: `${region.height * scale}px`,
                      top: `${region.top * scale}px`,
                      left: `${region.left * scale}px`,
                      zIndex: region.z_index,
                    }}
                  >
                    {/* Widget Preview */}
                    {hasWidget && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-2 bg-red-500">
                        <div className="text-white text-2xl">WIDGET HERE</div>
                      </div>
                    )}
                    
                    {/* Actual Widget Preview */}
                    {region.widget_type && region.widget_config && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-2">
                        {/* Text Widget Preview */}
                        {region.widget_type === 'text' && (
                          <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              backgroundColor: region.widget_config.backgroundColor || 'transparent',
                              color: region.widget_config.fontColor || '#ffffff',
                              fontSize: `${(region.widget_config.fontSize || 32) * scale}px`,
                              fontFamily: region.widget_config.fontFamily || 'Arial',
                              fontWeight: region.widget_config.fontWeight || 'normal',
                              fontStyle: region.widget_config.italic ? 'italic' : 'normal',
                              textDecoration: region.widget_config.underline ? 'underline' : 'none',
                              textAlign: region.widget_config.alignment || 'center',
                              padding: '8px',
                              wordBreak: 'break-word',
                              overflow: 'hidden'
                            }}
                          >
                            {region.widget_config.text || 'Text Widget'}
                          </div>
                        )}
                        
                        {/* Clock Widget Preview */}
                        {region.widget_type === 'clock' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            <svg className="w-12 h-12 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-xl font-bold">12:00:00</div>
                            {region.widget_config.showDate && (
                              <div className="text-xs opacity-80 mt-1">Jan 1, 2026</div>
                            )}
                          </div>
                        )}
                        
                        {/* Weather Widget Preview */}
                        {region.widget_type === 'weather' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                            <div className="text-2xl font-bold">25°C</div>
                            <div className="text-xs opacity-80 mt-1">{region.widget_config.location || 'Singapore'}</div>
                          </div>
                        )}
                        
                        {/* QR Code Widget Preview */}
                        {region.widget_type === 'qrcode' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                            {region.widget_config.content ? (
                              <QRCodeSVG 
                                value={region.widget_config.content} 
                                size={Math.min(region.width * scale, region.height * scale) * 0.8}
                                level="M"
                              />
                            ) : (
                              <>
                                <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center">
                                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                  </svg>
                                </div>
                                <div className="text-xs text-gray-600 mt-2">Enter content to generate QR</div>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* YouTube Widget Preview */}
                        {region.widget_type === 'youtube' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white">
                            <svg className="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <div className="text-xs opacity-80">YouTube Video</div>
                          </div>
                        )}
                        
                        {/* Countdown Widget Preview */}
                        {region.widget_type === 'countdown' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            <div className="text-xs opacity-80 mb-2">{region.widget_config.title || 'Countdown'}</div>
                            <div className="flex gap-2 text-center">
                              <div>
                                <div className="text-2xl font-bold">10</div>
                                <div className="text-xs opacity-80">Days</div>
                              </div>
                              <div className="text-2xl font-bold">:</div>
                              <div>
                                <div className="text-2xl font-bold">05</div>
                                <div className="text-xs opacity-80">Hours</div>
                              </div>
                              <div className="text-2xl font-bold">:</div>
                              <div>
                                <div className="text-2xl font-bold">30</div>
                                <div className="text-xs opacity-80">Min</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* RSS Widget Preview */}
                        {region.widget_type === 'rss' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            <div className="text-xs opacity-80">RSS Feed</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Preview */}
                    {!region.widget_type && content && (
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
          <div className="fixed top-[55%] max-h-[80%] overflow-y-scroll -translate-y-1/2 right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 w-80 animate-slide-left">
            <div className="flex items-center justify-between mb-6 ">
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
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Content Type</label>
                
                {/* Content Type Selection - Card Style */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => updateRegion(selectedRegion.id, { 
                      playlist_id: null,
                      content_id: null,
                      widget_type: null,
                      widget_config: null
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      !selectedRegion.widget_type && !selectedRegion.playlist_id && !selectedRegion.content_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <div className="text-xs font-body font-semibold">None</div>
                    </div>
                  </button>
                  <button
                    onClick={() => updateRegion(selectedRegion.id, { 
                      content_id: null,
                      widget_type: null,
                      widget_config: null
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedRegion.playlist_id && !selectedRegion.widget_type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div className="text-xs font-body font-semibold">Playlist</div>
                    </div>
                  </button>
                  <button
                    onClick={() => updateRegion(selectedRegion.id, { 
                      playlist_id: null,
                      widget_type: null,
                      widget_config: null
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedRegion.content_id && !selectedRegion.widget_type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-xs font-body font-semibold">File</div>
                    </div>
                  </button>
                  <button
                    onClick={() => updateRegion(selectedRegion.id, { 
                      playlist_id: null,
                      content_id: null,
                      widget_type: 'text',
                      widget_config: { text: 'Hello World', fontSize: 32, fontFamily: 'Arial', fontWeight: 'normal', fontColor: '#000000', backgroundColor: '#ffffff', alignment: 'center', bold: false, italic: false, underline: false }
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedRegion.widget_type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                      <div className="text-xs font-body font-semibold">Widget</div>
                    </div>
                  </button>
                </div>

                {/* Widget Type Selection */}
                {selectedRegion.widget_type && (
                  <div className="mb-3">
                    <label className="block text-xs font-body font-semibold text-gray-700 mb-2">Widget Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'text', label: 'Text', icon: 'M4 6h16M4 12h16M4 18h7' },
                        { value: 'clock', label: 'Clock', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { value: 'weather', label: 'Weather', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
                        { value: 'qrcode', label: 'QR Code', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
                        { value: 'youtube', label: 'YouTube', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { value: 'countdown', label: 'Timer', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { value: 'rss', label: 'RSS', icon: 'M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z' },
                      ].map(widget => (
                        <button
                          key={widget.value}
                          onClick={() => {
                            const widgetType = widget.value;
                            let defaultConfig = {};
                            
                            switch(widgetType) {
                              case 'weather':
                                defaultConfig = { location: 'Singapore', units: 'metric', showForecast: true };
                                break;
                              case 'clock':
                                defaultConfig = { format: '24h', showDate: true, showSeconds: true, timezone: 'Asia/Singapore' };
                                break;
                              case 'text':
                                defaultConfig = { text: 'Hello World', fontSize: 32, fontFamily: 'Arial', fontWeight: 'normal', fontColor: '#000000', backgroundColor: '#ffffff', alignment: 'center', bold: false, italic: false, underline: false, scrolling: false };
                                break;
                              case 'rss':
                                defaultConfig = { feedUrl: '', itemCount: 5, refreshInterval: 15, showImages: true, scrolling: true };
                                break;
                              case 'countdown':
                                defaultConfig = { targetDate: '2026-12-31T23:59:59', title: 'Countdown', showDays: true, showHours: true, showMinutes: true, showSeconds: true };
                                break;
                              case 'qrcode':
                                defaultConfig = { content: 'https://example.com', size: 300, errorCorrection: 'M' };
                                break;
                              case 'youtube':
                                defaultConfig = { videoId: '', autoplay: true, loop: true, muted: false };
                                break;
                              default:
                                defaultConfig = {};
                            }
                            
                            updateRegion(selectedRegion.id, { 
                              widget_type: widgetType,
                              widget_config: defaultConfig
                            });
                          }}
                          className={`p-2 rounded-lg border-2 transition-all text-left ${
                            selectedRegion.widget_type === widget.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <svg className="w-5 h-5 mb-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={widget.icon} />
                          </svg>
                          <div className="text-xs font-body font-semibold">{widget.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Widget Configuration */}
                {selectedRegion.widget_type && selectedRegion.widget_config && (
                  <div className="mb-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-body font-semibold text-blue-900">Widget Settings</span>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    
                    {/* Text Widget Config */}
                    {selectedRegion.widget_type === 'text' && (
                      <div className="space-y-3">
                        {/* Text Content */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2">Content</label>
                          <textarea
                            value={selectedRegion.widget_config.text || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, text: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-body focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Enter your text..."
                          />
                        </div>

                        {/* Typography */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2">Typography</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-body text-gray-600 mb-1">Font Family</label>
                              <select
                                value={selectedRegion.widget_config.fontFamily || 'Arial'}
                                onChange={(e) => updateRegion(selectedRegion.id, { 
                                  widget_config: { ...selectedRegion.widget_config, fontFamily: e.target.value }
                                })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-body focus:ring-2 focus:ring-blue-500"
                              >
                                <optgroup label="Sans-Serif">
                                  <option value="Arial">Arial</option>
                                  <option value="Helvetica">Helvetica</option>
                                  <option value="Verdana">Verdana</option>
                                  <option value="Tahoma">Tahoma</option>
                                  <option value="Trebuchet MS">Trebuchet MS</option>
                                </optgroup>
                                <optgroup label="Serif">
                                  <option value="Times New Roman">Times New Roman</option>
                                  <option value="Georgia">Georgia</option>
                                  <option value="Palatino">Palatino</option>
                                  <option value="Garamond">Garamond</option>
                                  <option value="Bookman">Bookman</option>
                                </optgroup>
                                <optgroup label="Monospace">
                                  <option value="Courier New">Courier New</option>
                                  <option value="Lucida Console">Lucida Console</option>
                                </optgroup>
                                <optgroup label="Display">
                                  <option value="Impact">Impact</option>
                                  <option value="Comic Sans MS">Comic Sans MS</option>
                                </optgroup>
                                <optgroup label="Web Fonts">
                                  <option value="Roboto">Roboto</option>
                                  <option value="Open Sans">Open Sans</option>
                                  <option value="Lato">Lato</option>
                                  <option value="Montserrat">Montserrat</option>
                                  <option value="Oswald">Oswald</option>
                                  <option value="Raleway">Raleway</option>
                                  <option value="Poppins">Poppins</option>
                                  <option value="Playfair Display">Playfair Display</option>
                                  <option value="Merriweather">Merriweather</option>
                                  <option value="Bungee">Bungee</option>
                                </optgroup>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-body text-gray-600 mb-1">Size (px)</label>
                                <input
                                  type="number"
                                  value={selectedRegion.widget_config.fontSize || 32}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, fontSize: parseInt(e.target.value) }
                                  })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-body focus:ring-2 focus:ring-blue-500"
                                  min="8"
                                  max="200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-body text-gray-600 mb-1">Weight</label>
                                <select
                                  value={selectedRegion.widget_config.fontWeight || 'normal'}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, fontWeight: e.target.value }
                                  })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-body focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="100">Thin</option>
                                  <option value="300">Light</option>
                                  <option value="normal">Normal</option>
                                  <option value="500">Medium</option>
                                  <option value="600">Semi Bold</option>
                                  <option value="bold">Bold</option>
                                  <option value="900">Black</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1.5 text-xs font-body text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRegion.widget_config.bold || false}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, bold: e.target.checked }
                                  })}
                                  className="rounded"
                                />
                                <span className="font-bold">B</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-xs font-body text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRegion.widget_config.italic || false}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, italic: e.target.checked }
                                  })}
                                  className="rounded"
                                />
                                <span className="italic">I</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-xs font-body text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRegion.widget_config.underline || false}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, underline: e.target.checked }
                                  })}
                                  className="rounded"
                                />
                                <span className="underline">U</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Colors */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2">Colors</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-body text-gray-600 mb-1">Text</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={selectedRegion.widget_config.fontColor || '#000000'}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, fontColor: e.target.value }
                                  })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={selectedRegion.widget_config.fontColor || '#000000'}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, fontColor: e.target.value }
                                  })}
                                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-body text-gray-600 mb-1">Background</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={selectedRegion.widget_config.backgroundColor || '#ffffff'}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, backgroundColor: e.target.value }
                                  })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={selectedRegion.widget_config.backgroundColor || '#ffffff'}
                                  onChange={(e) => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, backgroundColor: e.target.value }
                                  })}
                                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
                                  placeholder="#ffffff"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Layout */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="block text-xs font-body font-semibold text-gray-700 mb-2">Layout</label>
                          <div>
                            <label className="block text-xs font-body text-gray-600 mb-1">Alignment</label>
                            <div className="flex gap-1">
                              {[
                                { value: 'left', icon: 'M4 6h16M4 12h10M4 18h14' },
                                { value: 'center', icon: 'M4 6h16M7 12h10M5 18h14' },
                                { value: 'right', icon: 'M4 6h16M10 12h10M6 18h14' }
                              ].map(align => (
                                <button
                                  key={align.value}
                                  onClick={() => updateRegion(selectedRegion.id, { 
                                    widget_config: { ...selectedRegion.widget_config, alignment: align.value }
                                  })}
                                  className={`flex-1 p-2 rounded border-2 transition-all ${
                                    selectedRegion.widget_config.alignment === align.value
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <svg className="w-5 h-5 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={align.icon} />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clock Widget Config */}
                    {selectedRegion.widget_type === 'clock' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Format</label>
                          <select
                            value={selectedRegion.widget_config.format || '24h'}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, format: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                          >
                            <option value="12h">12 Hour</option>
                            <option value="24h">24 Hour</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.showDate || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, showDate: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Show Date
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.showSeconds || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, showSeconds: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Show Seconds
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Timezone</label>
                          <input
                            type="text"
                            value={selectedRegion.widget_config.timezone || 'Asia/Singapore'}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, timezone: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                            placeholder="Asia/Singapore"
                          />
                        </div>
                      </div>
                    )}

                    {/* Weather Widget Config */}
                    {selectedRegion.widget_type === 'weather' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Location</label>
                          <input
                            type="text"
                            value={selectedRegion.widget_config.location || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, location: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                            placeholder="Singapore"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Units</label>
                          <select
                            value={selectedRegion.widget_config.units || 'metric'}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, units: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                          >
                            <option value="metric">Celsius</option>
                            <option value="imperial">Fahrenheit</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.showForecast || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, showForecast: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Show Forecast
                          </label>
                        </div>
                      </div>
                    )}

                    {/* QR Code Widget Config */}
                    {selectedRegion.widget_type === 'qrcode' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Content (URL or Text)</label>
                          <textarea
                            value={selectedRegion.widget_config.content || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, content: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                            rows="2"
                            placeholder="https://example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Size (px)</label>
                          <input
                            type="number"
                            value={selectedRegion.widget_config.size || 300}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, size: parseInt(e.target.value) }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                          />
                        </div>
                      </div>
                    )}

                    {/* YouTube Widget Config */}
                    {selectedRegion.widget_type === 'youtube' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Video ID</label>
                          <input
                            type="text"
                            value={selectedRegion.widget_config.videoId || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, videoId: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                            placeholder="dQw4w9WgXcQ"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.autoplay || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, autoplay: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Autoplay
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.loop || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, loop: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Loop
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.muted || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, muted: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Muted
                          </label>
                        </div>
                      </div>
                    )}

                    {/* RSS Feed Widget Config */}
                    {selectedRegion.widget_type === 'rss' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Feed URL</label>
                          <input
                            type="text"
                            value={selectedRegion.widget_config.feedUrl || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, feedUrl: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                            placeholder="https://news.example.com/rss"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Item Count</label>
                          <input
                            type="number"
                            value={selectedRegion.widget_config.itemCount || 5}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, itemCount: parseInt(e.target.value) }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-body text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedRegion.widget_config.showImages || false}
                              onChange={(e) => updateRegion(selectedRegion.id, { 
                                widget_config: { ...selectedRegion.widget_config, showImages: e.target.checked }
                              })}
                              className="rounded"
                            />
                            Show Images
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Countdown Widget Config */}
                    {selectedRegion.widget_type === 'countdown' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Title</label>
                          <input
                            type="text"
                            value={selectedRegion.widget_config.title || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, title: e.target.value }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                            placeholder="Countdown"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-body text-gray-600 mb-1">Target Date & Time</label>
                          <input
                            type="datetime-local"
                            value={selectedRegion.widget_config.targetDate?.substring(0, 16) || ''}
                            onChange={(e) => updateRegion(selectedRegion.id, { 
                              widget_config: { ...selectedRegion.widget_config, targetDate: e.target.value + ':00' }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-body"
                          />
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}

                {/* Playlist Selection */}
                {!selectedRegion.widget_type && (
                  <div className="mb-3">
                    <label className="block text-xs font-body font-semibold text-gray-500 mb-1">Playlist (Multiple Files)</label>
                    <select
                      value={selectedRegion.playlist_id || ''}
                      onChange={(e) => updateRegion(selectedRegion.id, { 
                        playlist_id: e.target.value ? parseInt(e.target.value) : null,
                        content_id: null 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm"
                      disabled={!!selectedRegion.widget_type}
                    >
                      <option value="">No playlist</option>
                      {playlists.map(playlist => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Content Selection */}
                {!selectedRegion.widget_type && !selectedRegion.playlist_id && (
                  <div>
                    <label className="block text-xs font-body font-semibold text-gray-500 mb-1">Single File</label>
                    <button
                      onClick={() => setShowMediaPicker(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body text-sm text-left flex items-center justify-between transition-colors"
                      disabled={!!selectedRegion.widget_type}
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
                )}
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
