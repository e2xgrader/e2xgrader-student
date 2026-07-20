import { CommandRegistry } from '@lumino/commands';
import { TranslationBundle } from '@jupyterlab/translation';
import { SharedMaterialsAPI } from '@e2xgrader/core';
import { JupyterFrontEnd } from '@jupyterlab/application';

export class OpenSharedMaterialCommand
  implements CommandRegistry.ICommandOptions
{
  private _sharedMaterials: SharedMaterialsAPI.ISharedMaterial[] = [];
  private _materialNotFoundErrorMessage: string = this._trans.__(
    'ERROR: Unable to find material'
  );
  private _isEnabled = false;

  constructor(
    private _app: JupyterFrontEnd,
    private _trans: TranslationBundle
  ) {
    this.loadSharedMaterials();
  }

  label = (args: any): string => {
    const material = this.getSharedMaterialByPath(
      (args as OpenSharedMaterialCommand.IArgs).path
    );
    if (!material) {
      return this._materialNotFoundErrorMessage;
    }
    return material!.label;
  };

  caption = (args: any): string => {
    const material = this.getSharedMaterialByPath(
      (args as OpenSharedMaterialCommand.IArgs).path
    );
    if (!material) {
      return this._materialNotFoundErrorMessage;
    }
    return this._trans._p(
      'Opens the shared material "%1" in a new tab',
      material!.label
    );
  };

  isEnabled = (): boolean => {
    return this._isEnabled;
  };

  private updateCommand(): void {
    this._app.commands.notifyCommandChanged(
      OpenSharedMaterialCommand.COMMAND_ID
    );
  }

  private loadSharedMaterials(): void {
    SharedMaterialsAPI.fetchSharedMaterials().then(resources => {
      this._sharedMaterials = resources;
      if (resources.length > 0) {
        this._isEnabled = true;
      }
      this.updateCommand();
    });
  }

  execute = (args: any): void => {
    const material = this.getSharedMaterialByPath(
      (args as OpenSharedMaterialCommand.IArgs).path
    );
    if (!material) {
      return;
    }
    window.open(material!.path, '_blank')?.focus();
  };

  private getSharedMaterialByPath(
    path: string
  ): SharedMaterialsAPI.ISharedMaterial | undefined {
    const material = this._sharedMaterials.find(
      material => material.path === path
    );
    if (!material) {
      console.error('ERROR: Unable to find specified shared material!');
    }
    return material;
  }
}

export namespace OpenSharedMaterialCommand {
  export const COMMAND_ID: string = 'student:open-shared-material';
  export interface IArgs {
    path: string;
  }
}
