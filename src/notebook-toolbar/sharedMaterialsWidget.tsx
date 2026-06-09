import { ReactWidget, ToolbarButtonComponent } from '@jupyterlab/ui-components';
import React from 'react';

import { bookIcon } from '../icons';
import { TranslationBundle } from '@jupyterlab/translation';
import { SharedMaterialsAPI } from "@e2xgrader/core";


/**
 * The class name added to toolbar additional resources dropdown wrapper.
 */
const TOOLBAR_SHARED_MATERIALS_CLASS =
  'jp-Notebook-toolbarSharedMaterials';

/**
 * The class name added to toolbar additional resources dropdown.
 */
const TOOLBAR_SHARED_MATERIALS_DROPDOWN_CLASS =
  'jp-Notebook-toolbarSharedMaterialsDropdown';

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
export function createSharedMaterialsItem(
  trans: TranslationBundle
): ReactWidget {
  return new SharedMaterialsWidget(trans);
}

export class SharedMaterialsWidget extends ReactWidget {
  /**
   * Construct a new cell type switcher.
   */
  constructor(private trans: TranslationBundle) {
    super();
    this.addClass(TOOLBAR_SHARED_MATERIALS_CLASS);
    SharedMaterialsAPI.fetchSharedMaterials().then(resources => {
      this._sharedMaterials = resources;
      if (!this._sharedMaterials || this._sharedMaterials.length < 1) {
        this.hide();
      }
      this.update();
    });
  }

  handleButtonClick = (): void => {
    this.toggleDropdown();
  };

  toggleDropdown = (): void => {
    this._showDropdown = !this._showDropdown;
    this.update();
  };

  closeDropDown = (): void => {
    this._showDropdown = false;
    this.update();
  };

  handleLinkClick = (): void => {
    this.closeDropDown();
  };

  render(): React.JSX.Element {
    return (
      <div>
        <ToolbarButtonComponent
          tooltip={this.trans.__('list available additional resources')}
          label={this.trans.__('Additional Resources')}
          icon={bookIcon}
          iconClass={'reduce-icon-size'}
          onClick={this.handleButtonClick}
        />
        {this._showDropdown && (
          <ul className={TOOLBAR_SHARED_MATERIALS_DROPDOWN_CLASS}>
            {this._sharedMaterials.map(resource => {
              return (
                <li>
                  <a
                    target="_blank"
                    href={resource.path}
                    onClick={this.handleLinkClick}
                  >
                    {resource.label}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  private _showDropdown: boolean = false;
  private _sharedMaterials: SharedMaterialsAPI.ISharedMaterial[] = [];
}
