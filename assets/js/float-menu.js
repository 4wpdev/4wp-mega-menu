/**
 * Float Menu Handler
 * Handles floating menu display for navigation items containing float-menu-container block
 * To use: Add "Float Menu Container" block inside a navigation item
 */
(function() {
	'use strict';

	// Don't run in WordPress editor
	if (document.body.classList.contains('block-editor-page') || 
	    document.querySelector('.editor-styles-wrapper')) {
		return;
	}

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initFloatMenu);
	} else {
		initFloatMenu();
	}

	function initFloatMenu() {
		console.log('Float Menu: Initializing...');
		
		// Try to get block data from WordPress data store if available
		if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
			try {
				const blockData = wp.data.select('core/block-editor').getBlocks();
				console.log('Float Menu: Block data from store:', blockData);
				
				// Find navigation blocks and their inner blocks
				const findNavigationBlocks = (blocks) => {
					let result = [];
					blocks.forEach(block => {
						if (block.name === 'core/navigation-link' || block.name === 'core/navigation-submenu') {
							if (block.attributes?.isFloatMenu && block.attributes?.floatMenuContainerName) {
								result.push({
									containerName: block.attributes.floatMenuContainerName,
									clientId: block.clientId
								});
							}
						}
						if (block.innerBlocks && block.innerBlocks.length > 0) {
							result = result.concat(findNavigationBlocks(block.innerBlocks));
						}
					});
					return result;
				};
				
				const floatMenuItems = findNavigationBlocks(blockData);
				console.log('Float Menu: Found float menu items in block data:', floatMenuItems);
				
				// Add data attributes to menu items based on clientId
				floatMenuItems.forEach(item => {
					const menuItem = document.querySelector(`[data-wp-block-id="${item.clientId}"]`) ||
						document.querySelector(`[data-block-id="${item.clientId}"]`);
					if (menuItem) {
						const li = menuItem.closest('li') || menuItem;
						li.setAttribute('data-float-container-name', item.containerName);
						console.log('Float Menu: Added data-float-container-name to menu item', li);
					}
				});
			} catch (e) {
				console.warn('Float Menu: Could not access block data store', e);
			}
		}
		
		// Debug: Check all menu items
		const allMenuItems = document.querySelectorAll('.wp-block-navigation-item');
		console.log('Float Menu: All menu items found:', allMenuItems.length);
		allMenuItems.forEach((item, index) => {
			console.log(`Float Menu: Menu item ${index}:`, item, 'Attributes:', {
				'data-float-container-name': item.getAttribute('data-float-container-name'),
				'data-float-menu': item.getAttribute('data-float-menu'),
				'data-wp-block-id': item.getAttribute('data-wp-block-id'),
				classes: item.className
			});
		});
		
		// First, handle menu items with data-float-container-name (new method)
		setupFloatMenuFromMenuItems();

		// Also setup float menus from navigation (old method - for containers inside menu)
		const navigationBlocks = document.querySelectorAll('.wp-block-navigation');
		navigationBlocks.forEach(nav => {
			setupFloatMenuFromNavigation(nav);
		});
	}

	function setupFloatMenuFromMenuItems() {
		// Find all elements with data-float-container-name (menu items, icons, etc.)
		const menuItems = document.querySelectorAll('[data-float-container-name]');
		
		console.log('Float Menu: Found menu items:', menuItems.length);
		
		// Group menu items by container name to avoid creating duplicate float menus
		const containersMap = new Map();
		
		menuItems.forEach(menuItem => {
			// Skip if already processed
			if (menuItem.classList.contains('forwp-float-menu-trigger')) {
				console.log('Float Menu: Menu item already processed', menuItem);
				return;
			}

			const containerName = menuItem.getAttribute('data-float-container-name');
			console.log('Float Menu: Processing menu item with container name:', containerName);
			if (!containerName) {
				console.warn('Float Menu: Menu item has no container name', menuItem);
				return;
			}

			// Find the container by technical name
			let container = document.querySelector(`[data-technical-name="${containerName}"]`);
			if (!container) {
				// Try to find by class
				container = document.querySelector(`.float-menu-container[data-technical-name="${containerName}"]`);
			}
			if (!container) {
				console.warn('Float Menu: Container not found with technical name:', containerName);
				console.log('Float Menu: Available containers:', document.querySelectorAll('[data-technical-name]'));
				return;
			}

			console.log('Float Menu: Found container:', container);

			// Get container ID
			let containerId = container.id;
			if (!containerId || containerId === 'float-menu-undefined') {
				containerId = 'float-menu-' + Math.random().toString(36).substr(2, 9);
				container.id = containerId;
			}

			// Get or create float menu for this container
			let floatMenu = containersMap.get(containerId);
			if (!floatMenu) {
				// Check if float menu already exists in DOM
				floatMenu = document.querySelector(`[data-container-id="${containerId}"]`);
				if (!floatMenu) {
					// Create floating menu container with the content
					console.log('Float Menu: Creating float menu for container:', containerId);
					floatMenu = createFloatMenuFromContainer(container);
					floatMenu.setAttribute('data-container-id', containerId);
				}
				containersMap.set(containerId, floatMenu);
			}

			// Add data attribute to menu item pointing to this container
			menuItem.setAttribute('data-float-container-id', containerId);
			menuItem.classList.add('forwp-float-menu-trigger');
			
			// Hide submenu if it exists (only for navigation items)
			const submenu = menuItem.querySelector('.wp-block-navigation__submenu-container');
			if (submenu) {
				submenu.style.display = 'none';
			}

			// Find the clickable element (link for menu items, or the element itself for icons)
			let trigger = menuItem.querySelector('a');
			
			// If no link found, check if it's an icon block (forwp-icons/icon)
			if (!trigger) {
				// For icon blocks, use the wrapper div or the icon badge as trigger
				// Check for various possible class names
				if (menuItem.classList.contains('wp-block-forwp-icons-icon') || 
				    menuItem.classList.contains('wp-block-4wp-icons-icon') ||
				    menuItem.querySelector('.forwp-icon-badge') ||
				    menuItem.querySelector('.forwp-icon-badge__icon') ||
				    menuItem.querySelector('.forwp-icon-badge__link')) {
					trigger = menuItem;
				} else {
					console.warn('Float Menu: No clickable element found', menuItem, 'Classes:', menuItem.className);
					return;
				}
			}

			console.log('Float Menu: Setting up click handler for menu item', menuItem, 'FloatMenu:', floatMenu);

			// Handle click events
			trigger.addEventListener('click', function(e) {
				console.log('Float Menu: Click detected!', menuItem, floatMenu);
				e.preventDefault();
				e.stopPropagation();
				
				toggleFloatMenu(menuItem, floatMenu, trigger);
			});

			// Close on escape key (only add once per floatMenu)
			if (!floatMenu.escapeHandlerAdded) {
				const escapeHandler = function(e) {
					if (e.key === 'Escape' && floatMenu.classList.contains('is-open')) {
						closeFloatMenu(floatMenu);
					}
				};
				document.addEventListener('keydown', escapeHandler);
				floatMenu.escapeHandlerAdded = true;
			}
		});

		// Hide all processed containers
		containersMap.forEach((floatMenu, containerId) => {
			const container = document.getElementById(containerId);
			if (container && container.classList.contains('float-menu-container')) {
				container.style.display = 'none';
			}
		});
		
		console.log('Float Menu: Setup complete. Processed containers:', containersMap.size);
	}


	function setupFloatMenuFromNavigation(nav) {
		// Find all navigation items that contain float-menu-container block
		const floatMenuContainers = nav.querySelectorAll('.float-menu-container');
		
		floatMenuContainers.forEach(container => {
			// Find the parent navigation item
			const menuItem = container.closest('.wp-block-navigation-item');
			if (!menuItem) return;

			// Find the link inside this menu item
			const trigger = menuItem.querySelector('a');
			if (!trigger) return;

			// Mark as float menu trigger
			menuItem.classList.add('forwp-float-menu-trigger');
			
			// Create floating menu container with the content
			const floatMenu = createFloatMenuFromContainer(container);

			// Handle click events
			trigger.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				toggleFloatMenu(menuItem, floatMenu, trigger);
			});

			// Close on outside click
			const closeHandler = function(e) {
				if (!menuItem.contains(e.target) && !floatMenu.contains(e.target)) {
					closeFloatMenu(floatMenu);
				}
			};
			document.addEventListener('click', closeHandler);

			// Close on escape key
			const escapeHandler = function(e) {
				if (e.key === 'Escape' && floatMenu.classList.contains('is-open')) {
					closeFloatMenu(floatMenu);
				}
			};
			document.addEventListener('keydown', escapeHandler);

			// Handle window resize
			const resizeHandler = function() {
				if (floatMenu.classList.contains('is-open')) {
					positionFloatMenu(menuItem, floatMenu, trigger);
				}
			};
			window.addEventListener('resize', resizeHandler);
		});

		// Also support old method: items with isFloatMenu attribute and submenu (only if not already processed)
		const floatMenuItems = nav.querySelectorAll('.wp-block-navigation-item.forwp-float-menu:not(.forwp-float-menu-trigger), .wp-block-navigation-item[data-float-menu="true"]:not(.forwp-float-menu-trigger)');
		
		floatMenuItems.forEach(menuItem => {
			// Skip if already processed (has float-menu-container)
			if (menuItem.classList.contains('forwp-float-menu-trigger')) return;

			// Find the link inside this menu item
			const trigger = menuItem.querySelector('a');
			if (!trigger) return;

			// Check if this item has a submenu
			const submenu = menuItem.querySelector('.wp-block-navigation__submenu-container');
			if (!submenu) return;

			// Mark as float menu trigger
			menuItem.classList.add('forwp-float-menu-trigger');
			
			// Create floating menu container from submenu
			const floatMenu = createFloatMenuFromSubmenu(submenu);

			// Handle click events
			trigger.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				toggleFloatMenu(menuItem, floatMenu, trigger);
			});

			// Close on outside click
			const closeHandler = function(e) {
				if (!menuItem.contains(e.target) && !floatMenu.contains(e.target)) {
					closeFloatMenu(floatMenu);
				}
			};
			document.addEventListener('click', closeHandler);

			// Close on escape key
			const escapeHandler = function(e) {
				if (e.key === 'Escape' && floatMenu.classList.contains('is-open')) {
					closeFloatMenu(floatMenu);
				}
			};
			document.addEventListener('keydown', escapeHandler);

			// Handle window resize
			const resizeHandler = function() {
				if (floatMenu.classList.contains('is-open')) {
					positionFloatMenu(menuItem, floatMenu, trigger);
				}
			};
			window.addEventListener('resize', resizeHandler);
		});
	}

	function createFloatMenuFromContainer(container) {
		// Create overlay
		const overlay = document.createElement('div');
		overlay.className = 'forwp-float-menu-overlay';
		
		// Create float menu wrapper
		const floatMenu = document.createElement('div');
		floatMenu.className = 'forwp-float-menu';
		
		// Create header with close button
		const header = document.createElement('div');
		header.className = 'forwp-float-menu-header';
		
		const closeBtn = document.createElement('button');
		closeBtn.className = 'forwp-float-menu-close';
		closeBtn.innerHTML = '&times;';
		closeBtn.setAttribute('aria-label', 'Close menu');
		
		header.appendChild(closeBtn);
		
		// Create content wrapper
		const content = document.createElement('div');
		content.className = 'forwp-float-menu-content';
		
		// Clone the container content
		const clonedContent = container.cloneNode(true);
		clonedContent.classList.remove('float-menu-container');
		clonedContent.style.display = 'block';
		content.appendChild(clonedContent);
		
		floatMenu.appendChild(header);
		floatMenu.appendChild(content);
		
		// Append overlay and menu to body
		document.body.appendChild(overlay);
		document.body.appendChild(floatMenu);
		
		// Store overlay reference
		floatMenu.overlay = overlay;
		
		// Close button handler
		closeBtn.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			closeFloatMenu(floatMenu);
		});
		
		// Overlay click handler
		overlay.addEventListener('click', function(e) {
			if (e.target === overlay) {
				closeFloatMenu(floatMenu);
			}
		});
		
		return floatMenu;
	}

	function createFloatMenuFromSubmenu(submenu) {
		// Create overlay
		const overlay = document.createElement('div');
		overlay.className = 'forwp-float-menu-overlay';
		
		// Create float menu wrapper
		const floatMenu = document.createElement('div');
		floatMenu.className = 'forwp-float-menu';
		
		// Create header with close button
		const header = document.createElement('div');
		header.className = 'forwp-float-menu-header';
		
		const closeBtn = document.createElement('button');
		closeBtn.className = 'forwp-float-menu-close';
		closeBtn.innerHTML = '&times;';
		closeBtn.setAttribute('aria-label', 'Close menu');
		
		header.appendChild(closeBtn);
		
		// Create content wrapper
		const content = document.createElement('div');
		content.className = 'forwp-float-menu-content';
		content.innerHTML = submenu.innerHTML;
		
		floatMenu.appendChild(header);
		floatMenu.appendChild(content);
		
		// Append overlay and menu to body
		document.body.appendChild(overlay);
		document.body.appendChild(floatMenu);
		
		// Store overlay reference
		floatMenu.overlay = overlay;
		
		// Close button handler
		closeBtn.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			closeFloatMenu(floatMenu);
		});
		
		// Overlay click handler
		overlay.addEventListener('click', function(e) {
			if (e.target === overlay) {
				closeFloatMenu(floatMenu);
			}
		});
		
		return floatMenu;
	}

	function toggleFloatMenu(menuItem, floatMenu, trigger) {
		console.log('Float Menu: toggleFloatMenu called', { menuItem, floatMenu, trigger });
		const isOpen = floatMenu.classList.contains('is-open');
		console.log('Float Menu: isOpen:', isOpen);
		
		if (isOpen) {
			closeFloatMenu(floatMenu);
		} else {
			openFloatMenu(menuItem, floatMenu, trigger);
		}
	}

	function openFloatMenu(menuItem, floatMenu, trigger) {
		console.log('Float Menu: openFloatMenu called', { menuItem, floatMenu, overlay: floatMenu.overlay });
		
		// Close any other open float menus
		document.querySelectorAll('.forwp-float-menu.is-open').forEach(menu => {
			if (menu !== floatMenu) {
				closeFloatMenu(menu);
			}
		});

		// Prevent body scroll
		document.body.classList.add('forwp-float-menu-open');
		
		// Show overlay and menu
		if (floatMenu.overlay) {
			floatMenu.overlay.classList.add('is-open');
			console.log('Float Menu: Overlay opened');
		} else {
			console.warn('Float Menu: No overlay found!');
		}
		floatMenu.classList.add('is-open');
		menuItem.classList.add('is-active');
		console.log('Float Menu: Menu opened, classes added');
	}

	function closeFloatMenu(floatMenu) {
		// Remove open classes
		floatMenu.classList.remove('is-open');
		if (floatMenu.overlay) {
			floatMenu.overlay.classList.remove('is-open');
		}
		
		// Remove body scroll lock
		document.body.classList.remove('forwp-float-menu-open');
		
		// Remove active state from triggers
		const activeTrigger = document.querySelector('.forwp-float-menu-trigger.is-active');
		if (activeTrigger) {
			activeTrigger.classList.remove('is-active');
		}
	}
})();
