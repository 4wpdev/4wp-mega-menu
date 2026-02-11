import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl, ToggleControl, TextControl, SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';

import './style.scss';
import './editor.scss';

import panelMetadata from './blocks/mega-panel/block.json';
import floatMenuContainerMetadata from './blocks/float-menu-container/block.json';

registerBlockType( panelMetadata.name, {
	...panelMetadata,
	icon: 'menu',
	edit( props ) {
		const { attributes, setAttributes } = props;
		const { columns } = attributes;
		const blockProps = useBlockProps( {
			className: `mega-panel cols-${ columns }`,
		} );

		return (
			<li { ...blockProps }>
				<InspectorControls>
					<PanelBody title={ __( 'Mega settings', 'forwp-mega-menu' ) }>
						<RangeControl
							label={ __( 'Columns', 'forwp-mega-menu' ) }
							value={ columns }
							onChange={ ( value ) => setAttributes( { columns: value } ) }
							min={ 2 }
							max={ 6 }
						/>
					</PanelBody>
				</InspectorControls>
				<InnerBlocks
					allowedBlocks={ true }
					template={ [ [ 'core/columns' ] ] }
				/>
			</li>
		);
	},
	save( props ) {
		const { columns } = props.attributes;
		const blockProps = useBlockProps.save( {
			className: `mega-panel cols-${ columns }`,
		} );
		return (
			<li { ...blockProps }>
				<InnerBlocks.Content />
			</li>
		);
	},
} );

// Register Float Menu Container block
registerBlockType( floatMenuContainerMetadata.name, {
	...floatMenuContainerMetadata,
	icon: 'move',
	edit( props ) {
		const { attributes, setAttributes, clientId } = props;
		const { technicalName } = attributes;
		
		// Generate unique ID for this container if not set
		const containerId = `float-menu-${ clientId }`;
		
		const blockProps = useBlockProps( {
			className: 'float-menu-container',
			id: containerId,
		} );

		// Sanitize technical name (allow hyphens, remove spaces and special chars)
		const sanitizeTechnicalName = ( value ) => {
			return value
				.toLowerCase()
				.replace( /\s+/g, '-' ) // Replace spaces with hyphens
				.replace( /[^a-z0-9-]/g, '' ) // Keep only letters, numbers, and hyphens
				.replace( /-{2,}/g, '-' ); // Replace multiple consecutive hyphens with single hyphen
		};

		return (
			<div { ...blockProps }>
				<InspectorControls>
					<PanelBody title={ __( 'Float Menu Settings', 'forwp-mega-menu' ) }>
						<TextControl
							label={ __( 'Technical Name', 'forwp-mega-menu' ) }
							help={ __(
								'Enter a unique technical name (anchor) for this container. Use only letters, numbers, and hyphens. This name will be used to link this container to menu items.',
								'forwp-mega-menu'
							) }
							value={ technicalName }
							onChange={ ( value ) => setAttributes( { technicalName: sanitizeTechnicalName( value ) } ) }
							placeholder={ __( 'e.g., social-menu', 'forwp-mega-menu' ) }
						/>
					</PanelBody>
				</InspectorControls>
				<InnerBlocks
					allowedBlocks={ true }
				/>
			</div>
		);
	},
	save( props ) {
		const { attributes } = props;
		const { technicalName } = attributes;
		
		const blockProps = useBlockProps.save( {
			className: 'float-menu-container',
			'data-technical-name': technicalName || undefined,
		} );
		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
} );

// Extend navigation-link and navigation-submenu blocks with float menu option
const TARGET_BLOCKS = [ 'core/navigation-link', 'core/navigation-submenu' ];

// Add isFloatMenu attribute to navigation blocks
addFilter(
	'blocks.registerBlockType',
	'forwp-mega-menu/float-menu-attribute',
	( settings, name ) => {
		if ( TARGET_BLOCKS.indexOf( name ) === -1 ) {
			return settings;
		}

		settings.attributes = {
			...settings.attributes,
			isFloatMenu: {
				type: 'boolean',
				default: false,
			},
			floatMenuContainerName: {
				type: 'string',
				default: '',
			},
		};

		return settings;
	}
);

// Add float menu toggle control to inspector
const withFloatMenuControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( TARGET_BLOCKS.indexOf( props.name ) === -1 ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props;
		const { isFloatMenu, floatMenuContainerName } = attributes;

		// Get all float menu containers from the page
		const floatMenuContainers = useSelect( ( select ) => {
			const blocks = select( 'core/block-editor' ).getBlocks();
			
			// Flatten all blocks recursively
			const flattenBlocks = ( blockList ) => {
				let result = [];
				blockList.forEach( ( block ) => {
					if ( block.name === 'fse/float-menu-container' ) {
						const technicalName = block.attributes?.technicalName || '';
						if ( technicalName ) {
							result.push( {
								label: technicalName,
								value: technicalName,
							} );
						}
					}
					if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
						result = result.concat( flattenBlocks( block.innerBlocks ) );
					}
				} );
				return result;
			};

			return flattenBlocks( blocks );
		}, [] );

		// Remove duplicates
		const uniqueContainers = floatMenuContainers.filter( ( container, index, self ) =>
			index === self.findIndex( ( c ) => c.value === container.value )
		);

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody title={ __( 'Float Menu', 'forwp-mega-menu' ) } initialOpen={ false }>
						<ToggleControl
							label={ __( 'Enable Float Menu', 'forwp-mega-menu' ) }
							help={ __(
								'Show this menu item as a floating menu on click instead of dropdown',
								'forwp-mega-menu'
							) }
							checked={ isFloatMenu }
							onChange={ ( value ) => setAttributes( { isFloatMenu: value } ) }
						/>
						{ isFloatMenu && (
							<SelectControl
								label={ __( 'Float Menu Container', 'forwp-mega-menu' ) }
								help={ __(
									'Select the float menu container to display when this menu item is clicked',
									'forwp-mega-menu'
								) }
								value={ floatMenuContainerName }
								options={ [
									{ label: __( '-- Select Container --', 'forwp-mega-menu' ), value: '' },
									...uniqueContainers,
								] }
								onChange={ ( value ) => setAttributes( { floatMenuContainerName: value } ) }
							/>
						) }
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withFloatMenuControl' );

addFilter( 'editor.BlockEdit', 'forwp-mega-menu/float-menu-control', withFloatMenuControl );

