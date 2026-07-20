import { SharedMaterialsAPI, ToolbarDropdownComponent } from '@e2xgrader/core';
import { TranslationBundle } from '@jupyterlab/translation';
import { bookIcon } from '../icons';
import { OpenSharedMaterialCommand } from './openSharedMaterialCommand';
import { CommandRegistry } from '@lumino/commands';
import { ToolbarRegistry } from '@jupyterlab/apputils';

const TOOLBAR_SHARED_MATERIALS_CLASS: string =
  'e2x-notebook-toolbar-shared-materials-widget-class';

export class SharedMaterialsWidget extends ToolbarDropdownComponent {
  private readonly _pr: ToolbarDropdownComponent.IProps = {
    id: SharedMaterialsWidget.WIDGET_ID,
    label: this._trans.__('Additional Resources'),
    caption: this._trans.__('list available additional resources'),
    icon: bookIcon,
    commands: []
  };

  private _isVisible: boolean = false;

  constructor(
    private _trans: TranslationBundle,
    private _commandRegistry: CommandRegistry,
    toolbarItem?: ToolbarRegistry.IWidget
  ) {
    super({
      id: SharedMaterialsWidget.WIDGET_ID,
      icon: bookIcon,
      commands: []
    });
    this._pr.alignRight = toolbarItem?.alignRight === true;

    this.setProps(this._pr);
    this.addClass(TOOLBAR_SHARED_MATERIALS_CLASS);

    this.loadSharedMaterials();
  }

  private async loadSharedMaterials(): Promise<void> {
    await SharedMaterialsAPI.fetchSharedMaterials().then(materials => {
      materials.forEach(item => {
        this._pr.commands.push({
          commands: this._commandRegistry,
          id: OpenSharedMaterialCommand.COMMAND_ID,
          args: {
            path: item.path
          }
        });
      });

      if (materials.length > 0) {
        this._isVisible = true;
        this.update();
      }
    });
  }

  get isVisible(): boolean {
    return this._isVisible;
  }
}

export namespace SharedMaterialsWidget {
  export const WIDGET_ID: string = 'shared-materials';
}
