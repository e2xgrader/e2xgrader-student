import {ReactWidget, ToolbarButtonComponent} from '@jupyterlab/ui-components';
import * as React from 'react';

import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import {bookIcon} from "./icons";
import {TranslationBundle} from "@jupyterlab/translation";

export interface AdditionalResource {
  label: string;
  path: string;
}

export const RESOURCE_API_PATH = 'e2xgrader/api/shared-materials';
export const RESOURCE_STATIC_FILE_PATH = 'e2xgrader/static/shared-materials/';
/**
 * The class name added to toolbar additional resources dropdown wrapper.
 */
const TOOLBAR_ADDITIONAL_RESOURCES_CLASS = 'jp-Notebook-toolbarAdditionalResources';

/**
 * The class name added to toolbar additional resources dropdown.
 */
const TOOLBAR_ADDITIONAL_RESOURCES_DROPDOWN_CLASS = 'jp-Notebook-toolbarAdditionalResourcesDropdown';

/**
 * Create an additional resources dropdown item.
 *
 * #### Notes
 * It will display the type of the current active cell.
 * If more than one cell is selected but are of different types,
 * it will display `'-'`.
 * When the user changes the cell type, it will change the
 * cell types of the selected cells.
 * It can handle a change to the context.
 */
export function createAdditionalResourcesItem(trans: TranslationBundle): ReactWidget {
  return new AdditionalResourcesWidget(trans);
}

export class AdditionalResourcesWidget extends ReactWidget {
  /**
   * Construct a new cell type switcher.
   */
  constructor(private trans: TranslationBundle) {
    super();
    this.addClass(TOOLBAR_ADDITIONAL_RESOURCES_CLASS);
    this.fetchAdditionalResources().then(resources => {
      this._additionalResources = resources;
      if(!this._additionalResources || this._additionalResources.length < 1) this.hide();
      this.update();
    });
  }

  handleButtonClick = (): void => {
    this.toggleDropdown();
  }

  toggleDropdown = (): void => {
    this._showDropdown = !this._showDropdown;
    this.update();
  }

  closeDropDown = (): void => {
    this._showDropdown = false;
    this.update();
  }

  handleLinkClick = (): void => {
    this.closeDropDown();
  }

  render(): JSX.Element {
    return (<div>
          <ToolbarButtonComponent tooltip={this.trans.__('list available additional resources')} label={this.trans.__('Additional Resources')} icon={bookIcon} iconClass={'reduce-icon-size'} onClick={this.handleButtonClick} />
          {this._showDropdown && (<ul className={TOOLBAR_ADDITIONAL_RESOURCES_DROPDOWN_CLASS}>
            {this._additionalResources.map(resource => {
              return <li>
                <a target="_blank" href={resource.path} onClick={this.handleLinkClick}>{resource.label}</a>
              </li>;
            })}
          </ul>)}
        </div>
    );
  }

  private async fetchAdditionalResources(): Promise<AdditionalResource[]>{
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl,RESOURCE_API_PATH);

    return ServerConnection.makeRequest(requestUrl, {}, settings)
      .then(async (response) => {
        return (await response.json() as [label: string, path: string][])
            .map(([label, path]) => ({label, path: URLExt.join(settings.baseUrl, RESOURCE_STATIC_FILE_PATH, path)}));
      })
      .catch(error => {
        throw new ServerConnection.NetworkError(error as TypeError);
      });
  }

  private _showDropdown: boolean = false;
  private _additionalResources: AdditionalResource[] = [];
}