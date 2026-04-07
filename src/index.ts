import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { E2XContentFactoryStudent } from './factory';
import { E2xGraderCellRegistry } from '@e2xgrader/core';
import { ITranslator } from '@jupyterlab/translation';
import { registerCommands } from './commands';
import {
    IToolbarWidgetRegistry,
    ICommandPalette
} from '@jupyterlab/apputils';
import { ToolbarItems } from './notebook_toolbar';
import {SubmitCommand} from "./submitCommand";
import {createAdditionalResourcesItem} from "./additionalResourcesWidget";

export const SUBMIT_COMMAND_ID = 'e2xgrader:submit-notebook';
export const NOTEBOOK_FACTORY_NAME = 'Notebook'; //The name of the factory that creates notebooks.

/**
 * Initialization data for the @e2xgrader/student extension.
 */
const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> =
  {
    id: '@e2xgrader/student:plugin',
    description: 'A JupyterLab extension for e2xgrader student mode',
    autoStart: true,
    requires: [IEditorServices, E2xGraderCellRegistry.IE2xGraderCellRegistry],
    provides: NotebookPanel.IContentFactory,
    activate: (
      _app: JupyterFrontEnd,
      editorServices: IEditorServices,
      cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry
    ) => {
      console.log(
        'JupyterLab extension @e2xgrader/student:plugin is activated!'
      );

      const editorFactory = editorServices.factoryService.newInlineEditor;
      const contentFactory = new E2XContentFactoryStudent(
        {
          editorFactory
        },
        undefined,
        cellRegistry
      );
      return contentFactory;
    }
  };

const studentCommandsPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:commands',
  description: 'A JupyterLab extension for e2xgrader student mode',
  autoStart: true,
  requires: [
    ITranslator,
    INotebookTracker,
    IToolbarWidgetRegistry,
    ISettingRegistry
  ],
  activate: async (
    app: JupyterFrontEnd,
    translator: ITranslator,
    tracker: INotebookTracker,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingRegistry: ISettingRegistry
  ) => {
    console.log(
      'JupyterLab extension @e2xgrader/student:commands is activated!'
    );
    const settings = await settingRegistry.load(studentCommandsPlugin.id);
    registerCommands(app, tracker, translator, settings);
    toolbarRegistry.addFactory<NotebookPanel>(
      'Notebook',
      'e2xCellType',
      panel => ToolbarItems.createCellTypeItem(panel, translator)
    );
  }
};

/**
 * Initialization data for the @e2xgrader/student:submit-command extension.
 */
export const submitCommandPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:submit-command',
  description: 'adds a submit command.',
  requires: [
      INotebookTracker,
      ICommandPalette,
      ITranslator
  ],
  autoStart: true,
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker, commandPalette: ICommandPalette, translator: ITranslator) => {
    console.log('registering submit command');
    const trans = translator.load('e2xgrader_student');
    app.commands.addCommand(SUBMIT_COMMAND_ID, new SubmitCommand(app, notebookTracker, trans));
    commandPalette.addItem({
      command: SUBMIT_COMMAND_ID,
      category: 'e2xgrader'
    });
  }
};

/**
 * Initialization data for the @e2xgrader/student:additional-resources-widget extension.
 */
export const additionalResourcesWidgetPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:additional-resources-widget',
  description: 'adds a toolbar widget, to offer additional resources.',
  requires: [
      IToolbarWidgetRegistry,
      ITranslator
  ],
  autoStart: true,
  activate: (app: JupyterFrontEnd, toolbarWidgetRegistry: IToolbarWidgetRegistry, translator: ITranslator) => {
    console.log('registering additional resources widget');
    const trans = translator.load('e2xgrader_student');
    toolbarWidgetRegistry.addFactory<NotebookPanel>(NOTEBOOK_FACTORY_NAME, 'additional_resources', () =>
      createAdditionalResourcesItem(trans)
    );
  }
};

export default [cellFactoryPlugin, studentCommandsPlugin, submitCommandPlugin, additionalResourcesWidgetPlugin];
