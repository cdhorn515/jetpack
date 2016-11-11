/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule,
	getModules
} from 'state/modules';
import ProStatus from 'pro-status';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import {
	getSiteAdminUrl,
	getSiteRawUrl,
	isSitePublic,
	userCanManageModules as _userCanManageModules
} from 'state/initial-state';
import { getSitePlan } from 'state/site';

export const Engagement = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props,
		isAdmin = props.userCanManageModules,
		sitemapsDesc = getModule( 'sitemaps' ).description,
		moduleList = Object.keys( props.moduleList );

	if ( ! props.isSitePublic ) {
		sitemapsDesc = <span>
			{ sitemapsDesc }
			{ <p className="jp-form-setting-explanation">
				{ __( 'Your site must be accessible by search engines for this feature to work properly. You can change this in {{a}}Reading Settings{{/a}}.', {
					components: {
						a: <a href={ props.siteAdminUrl + 'options-reading.php#blog_public' } className="jetpack-js-stop-propagation" />
					}
				} ) }
			</p> }
		</span>;
	}

	/**
	 * Array of modules that directly map to a card for rendering
	 * @type {Array}
	 */
	let cards = [
		[ 'seo-tools', getModule( 'seo-tools' ).name, getModule( 'seo-tools' ).description, getModule( 'seo-tools' ).learn_more_button ],
		[ 'stats', getModule( 'stats' ).name, getModule( 'stats' ).description, getModule( 'stats' ).learn_more_button ],
		[ 'sharedaddy', getModule( 'sharedaddy' ).name, getModule( 'sharedaddy' ).description, getModule( 'sharedaddy' ).learn_more_button ],
		[ 'publicize', getModule( 'publicize' ).name, getModule( 'publicize' ).description, getModule( 'publicize' ).learn_more_button ],
		[ 'related-posts', getModule( 'related-posts' ).name, getModule( 'related-posts' ).description, getModule( 'related-posts' ).learn_more_button ],
		[ 'comments', getModule( 'comments' ).name, getModule( 'comments' ).description, getModule( 'comments' ).learn_more_button ],
		[ 'likes', getModule( 'likes' ).name, getModule( 'likes' ).description, getModule( 'likes' ).learn_more_button ],
		[ 'subscriptions', getModule( 'subscriptions' ).name, getModule( 'subscriptions' ).description, getModule( 'subscriptions' ).learn_more_button ],
		[ 'gravatar-hovercards', getModule( 'gravatar-hovercards' ).name, getModule( 'gravatar-hovercards' ).description, getModule( 'gravatar-hovercards' ).learn_more_button ],
		[ 'sitemaps', getModule( 'sitemaps' ).name, sitemapsDesc, getModule( 'sitemaps' ).learn_more_button ],
		[ 'enhanced-distribution', getModule( 'enhanced-distribution' ).name, getModule( 'enhanced-distribution' ).description, getModule( 'enhanced-distribution' ).learn_more_button ],
		[ 'verification-tools', getModule( 'verification-tools' ).name, getModule( 'verification-tools' ).description, getModule( 'verification-tools' ).learn_more_button ]
	],
		nonAdminAvailable = [ 'publicize' ];
	// Put modules available to non-admin user at the top of the list.
	if ( ! isAdmin ) {
		let cardsCopy = cards.slice();
		cardsCopy.reverse().forEach( ( element ) => {
			if ( includes( nonAdminAvailable, element[0] ) ) {
				cards.unshift( element );
			}
		} );
		cards = cards.filter( ( element, index ) => cards.indexOf( element ) === index );
	}
	cards = cards.map( ( element ) => {
		if ( ! includes( moduleList, element[0] ) ) {
			return null;
		}
		var unavailableInDevMode = props.isUnavailableInDevMode( element[0] ),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
			toggle = '',
			adminAndNonAdmin = isAdmin || includes( nonAdminAvailable, element[0] ),
			isPro = 'seo-tools' === element[0],
			proProps = {},
			isModuleActive = isModuleActivated( element[0] );

		if ( isPro && props.sitePlan.product_slug !== 'jetpack_business' ) {
			proProps = {
				module: element[0],
				configure_url: ''
			};

			toggle = <ProStatus proFeature={ element[0] } />;

			// Add a "pro" button next to the header title
			element[1] = <span>
				{ element[1] }
				<Button
					compact={ true }
					href="#/plans"
				>
					{ __( 'Pro' ) }
				</Button>
			</span>;
		}

		if ( unavailableInDevMode ) {
			toggle = __( 'Unavailable in Dev Mode' );
		} else if ( isAdmin ) {
			toggle = <ModuleToggle slug={ element[0] }
						activated={ isModuleActive }
						toggling={ isTogglingModule( element[0] ) }
						toggleModule={ toggleModule } />;
		}

		let moduleDescription = isModuleActive ?
			<AllModuleSettings module={ isPro ? proProps : getModule( element[ 0 ] ) } /> :
			// Render the long_description if module is deactivated
			<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />;

		if ( element[0] === 'seo-tools' ) {
			moduleDescription = <AllModuleSettings module={ isPro ? proProps : getModule( element[ 0 ] ) } />;
		}

		if ( element[0] === 'seo-tools' ) {
			if ( props.sitePlan.product_slug === 'jetpack_business' ) {
				proProps.configure_url = 'https://wordpress.com/settings/seo/' + props.siteRawUrl;
			}

			moduleDescription = <AllModuleSettings module={ proProps } />;
		}

		return adminAndNonAdmin ? (
			<FoldableCard
				className={ customClasses }
				key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: element[0],
						path: props.route.path
					}
				) }
			>
				{
					moduleDescription
				}
				<div className="jp-module-settings__read-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
					{
						'stats' === element[0] && isModuleActive ? (
							<span>
								<span className="jp-module-settings__more-sep" />
								<span className="jp-module-settings__more-text">{
									__( 'View {{a}}All Stats{{/a}}', {
										components: {
											a: <a href={ props.siteAdminUrl + 'admin.php?page=stats' } />
										}
									} )
								}</span>
							</span>
						) : ''
					}
					{
						'subscriptions' === element[0] && isModuleActive ? (
							<span>
								<span className="jp-module-settings__more-sep" />
								<span className="jp-module-settings__more-text">{
									__( 'View your {{a}}Email Followers{{/a}}', {
										components: {
											a: <a href={ 'https://wordpress.com/people/email-followers/' + props.siteRawUrl } />
										}
									} )
								}</span>
							</span>
						) : ''
					}
				</div>
			</FoldableCard>
		) : false;
	} );
	return (
		<div>
			{ cards }
		</div>
	);
};

function renderLongDescription( module ) {
	// Rationale behind returning an object and not just the string
	// https://facebook.github.io/react/tips/dangerously-set-inner-html.html
	return { __html: module.long_description };
}

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			isSitePublic: isSitePublic( state ),
			sitePlan: getSitePlan( state ),
			userCanManageModules: _userCanManageModules( state ),
			moduleList: getModules( state )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			}
		};
	}
)( Engagement );
