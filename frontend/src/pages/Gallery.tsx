import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

// 🔹 Each gallery item from database
interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  largeImage: string;
  smallImage: string;
  category: string;
  tags: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  formattedCreatedAt: string;
}

// 🔹 Props for Gallery
interface GalleryProps {
  data?: GalleryItem[];
}

// 🔹 Admin Controls Component
const AdminControls: React.FC<{ onAddNew: () => void; onRefresh: () => void }> = ({ onAddNew, onRefresh }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '10px'
    }}>
      <button
        onClick={onAddNew}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#218838';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#28a745';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        ➕ Add New Gallery Item
      </button>
      <button
        onClick={onRefresh}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0056b3';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#007bff';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
};

// 🔹 Gallery Item Component with Admin Controls
const GalleryItemComponent: React.FC<{ 
  item: GalleryItem; 
  isAdmin: boolean; 
  onEdit: (item: GalleryItem) => void;
  onDelete: (item: GalleryItem) => void;
}> = ({ item, isAdmin, onEdit, onDelete }) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* Admin Controls Overlay */}
      {isAdmin && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          display: 'flex',
          gap: '5px'
        }}>
          <button
            onClick={() => onEdit(item)}
            style={{
              backgroundColor: 'rgba(0, 123, 255, 0.9)',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            style={{
              backgroundColor: 'rgba(220, 53, 69, 0.9)',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}
      
      {/* Featured Badge */}
      {item.featured && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 193, 7, 0.9)',
          color: 'black',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          ⭐ Featured
        </div>
      )}

      {/* Gallery Image using original Image component structure */}
      <div className="portfolio-item">
        <div className="hover-bg">
          <a href={item.largeImage} title={item.title} data-lightbox-gallery="gallery1">
            <div className="hover-text">
              <h4>{item.title}</h4>
              {item.description && <p>{item.description}</p>}
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '10px' }}>
                <span>📂 {item.category}</span>
                {item.tags.length > 0 && (
                  <span style={{ marginLeft: '10px' }}>
                    🏷️ {item.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
            <img src={item.smallImage} className="img-responsive" alt={item.title} />
          </a>
        </div>
      </div>
    </div>
  );
};

export const Gallery: React.FC<GalleryProps> = ({ data: propData }) => {
  const { user } = useAuth();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  const isAdmin = user?.role === 'admin';

  // Debug logging
  console.log('Gallery Debug Info:');
  console.log('User object:', user);
  console.log('User role:', user?.role);
  console.log('Is Admin:', isAdmin);
  console.log('User from localStorage:', localStorage.getItem('user'));
  console.log('Token from localStorage:', localStorage.getItem('token'));

  // Load gallery items from API
  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:3001/api/v1/gallery_items');
      const data = await response.json();
      
      if (data.success) {
        setGalleryItems(data.data.gallery_items);
        setCategories(data.data.categories);
      } else {
        setError('Failed to load gallery items');
      }
    } catch (err) {
      console.error('Error loading gallery items:', err);
      setError('Network error loading gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use prop data if provided (for backward compatibility), otherwise load from API
    if (propData) {
      setGalleryItems(propData);
      setLoading(false);
    } else {
      loadGalleryItems();
    }
  }, [propData]);

  const handleAddNew = () => {
    // TODO: Open add new gallery item modal
    alert('Add New Gallery Item - Coming Soon!\n\nThis will open a form to create a new gallery item.');
  };

  const handleEdit = (item: GalleryItem) => {
    // TODO: Open edit gallery item modal
    alert(`Edit Gallery Item: ${item.title}\n\nThis will open a form to edit this gallery item.`);
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:3001/api/v1/gallery_items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Gallery item deleted successfully!');
        loadGalleryItems(); // Refresh the list
      } else {
        alert('Failed to delete gallery item: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting gallery item:', err);
      alert('Network error deleting gallery item');
    }
  };

  if (loading) {
    return (
      <div id="portfolio" className="text-center">
        <div className="container">
          <div className="section-title">
            <h2>Gallery</h2>
            <p>Loading gallery items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="portfolio" className="text-center">
        <div className="container">
          <div className="section-title">
            <h2>Gallery</h2>
            <p style={{ color: 'red' }}>Error: {error}</p>
            <button 
              onClick={loadGalleryItems}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        {/* Admin Controls */}
        {isAdmin && (
          <AdminControls onAddNew={handleAddNew} onRefresh={loadGalleryItems} />
        )}

        <div className="section-title">
          <h2>Gallery</h2>
          <p>
            Explore moments from our journey — from installing water infrastructure to
            community outreach and agricultural support. These images highlight the
            impact of clean and reliable water in transforming lives.
          </p>
          
          {/* Debug Info */}
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '15px',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            <strong>🐛 Debug Info:</strong><br/>
            User: {user ? JSON.stringify(user, null, 2) : 'null'}<br/>
            Is Admin: {isAdmin ? 'YES' : 'NO'}<br/>
            Role: {user?.role || 'undefined'}
          </div>
          
          {isAdmin && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              padding: '10px',
              borderRadius: '5px',
              marginTop: '15px',
              fontSize: '14px'
            }}>
              🔧 <strong>Admin Mode:</strong> You can edit and delete gallery items. Total items: {galleryItems.length}
            </div>
          )}
        </div>
        
        <div className="row">
          <div className="portfolio-items">
            {galleryItems.length > 0 ? (
              galleryItems.map((item) => (
                <div
                  key={item.id}
                  className="col-sm-6 col-md-4 col-lg-4"
                >
                  <GalleryItemComponent
                    item={item}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))
            ) : (
              <div className="col-12">
                <p>No gallery items found.</p>
                {isAdmin && (
                  <button
                    onClick={handleAddNew}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginTop: '20px'
                    }}
                  >
                    ➕ Add First Gallery Item
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
