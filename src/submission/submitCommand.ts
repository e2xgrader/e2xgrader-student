import { CommandRegistry } from '@lumino/commands';
import { paperPlaneIcon, spinnerIcon } from '../icons';
import { LabIcon } from '@jupyterlab/ui-components';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import { SUBMIT_COMMAND_ID } from '../index';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import {
  INbGraderAssignment,
  INbGraderNotebook,
  IE2xGraderSubmissionResponse
} from '@e2xgrader/core';
import { SubmissionConfirmationWidget } from './submissionConfirmationWidget';
import { TranslationBundle } from '@jupyterlab/translation';
import { JupyterFrontEnd } from '@jupyterlab/application';

export const SUBMITTABLE_NOTEBOOK_META_KEY = 'e2xGrader';
const COURSE_API_PATH = 'courses';
const ASSIGNMENT_API_PATH = 'assignments';
const SUBMIT_NOTEBOOK_API_PATH = 'assignments/submit';
export const SUBMISSION_CONFIRMATION_BUTTON_CLASS =
  'e2x-submission-confirmation-button';
export const SUBMISSION_REJECTION_BUTTON_CLASS =
  'e2x-submission-rejection-button';

export class SubmitCommand implements CommandRegistry.ICommandOptions {
  //label: () => string = () => this.trans.__('Submit');
  caption: string = this.trans.__('Submit notebook');
  icon = (): LabIcon => {
    return this.submitting ? spinnerIcon : paperPlaneIcon;
  };
  //iconLabel = this.trans.__('Submit');
  iconClass: string = 'reduce-icon-size';
  _fetchedAssignments: INbGraderAssignment[] = [];
  private tracker?: INotebookTracker;
  static instanceId: number = 0;
  private submitting: boolean = false;

  constructor(
    private app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    private trans: TranslationBundle
  ) {
    this.tracker = notebookTracker;
    this.tracker.widgetAdded.connect(
      (tracker: INotebookTracker, widget: NotebookPanel) => {
        this.loadFetchedAssignments().then(() => {
          this.updateSubmitButtons();
        });
      }
    );
    this.tracker.currentChanged.connect(
      (tracker: INotebookTracker, widget: NotebookPanel | null) => {
        this.updateSubmitButtons();
      }
    );
  }

  private updateSubmitButtons = (): void => {
    this.app.commands.notifyCommandChanged(SUBMIT_COMMAND_ID);
  };

  isVisible = (): boolean => {
    return (
      this.tracker?.currentWidget?.model?.metadata[
        SUBMITTABLE_NOTEBOOK_META_KEY
      ] !== undefined
    );
  };

  isEnabled = (): boolean => {
    if (this.submitting) {
      return false;
    }
    return !!this.findAssignment(
      this.tracker?.currentWidget?.context.localPath ?? ''
    );
  };

  private getCurrentNotebookPath = (): string | undefined => {
    return this.tracker?.currentWidget?.context.localPath;
  };

  private async loadFetchedAssignments(): Promise<void> {
    this._fetchedAssignments = [];
    await this.fetchCourses().then(async courses =>
      Promise.all(
        courses.map(async courseId => {
          await this.fetchAssignments(courseId).then(assignments => {
            this._fetchedAssignments.push(
              ...assignments.filter(
                assignment => assignment.status === 'fetched'
              )
            );
          });
        })
      )
    );
  }

  private async fetchCourses(): Promise<string[]> {
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, COURSE_API_PATH);

    return ServerConnection.makeRequest(requestUrl, {}, settings)
      .then(async response => {
        return (await response.json()).value;
      })
      .catch(error => {
        throw new ServerConnection.NetworkError(error as TypeError);
      });
  }

  private async fetchAssignments(
    courseId: string
  ): Promise<INbGraderAssignment[]> {
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
      settings.baseUrl,
      ASSIGNMENT_API_PATH,
      '?course_id=' + encodeURIComponent(courseId)
    );

    return ServerConnection.makeRequest(requestUrl, {}, settings)
      .then(async response => {
        return (await response.json()).value;
      })
      .catch(error => {
        throw new ServerConnection.NetworkError(error as TypeError);
      });
  }

  private findAssignment = (path: string): INbGraderAssignment | undefined => {
    return this._fetchedAssignments.find(assignment =>
      assignment.notebooks.some(
        (notebook: INbGraderNotebook) => notebook.path === path
      )
    );
  };

  private blockSubmitButton = (): void => {
    this.submitting = true;
    this.updateSubmitButtons();
  };

  private unblockSubmitButton = (): void => {
    this.submitting = false;
    this.updateSubmitButtons();
  };

  execute = async (): Promise<void> => {
    this.blockSubmitButton();
    const notebookPath: string | undefined = this.getCurrentNotebookPath();
    if (!notebookPath) {
      console.warn(
        "unable to identify the current notebook's path -> unable to submit"
      );
      this.unblockSubmitButton();
      return;
    }
    const assignment: INbGraderAssignment | undefined =
      this.findAssignment(notebookPath);
    if (!assignment) {
      console.warn(
        'notebook seems not to be part of any assignment -> unable to submit'
      );
      this.unblockSubmitButton();
      return;
    }
    const dataToSend = {
      course_id: assignment.course_id,
      assignment_id: assignment.assignment_id
    };

    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, SUBMIT_NOTEBOOK_API_PATH);

    await ServerConnection.makeRequest(
      requestUrl,
      { method: 'POST', body: JSON.stringify(dataToSend) },
      settings
    )
      .then(async response => {
        if (response.status === 200) {
          const responseData: IE2xGraderSubmissionResponse =
            await response.json();
          console.log('notebook has been submitted');
          if (responseData.hashcode && responseData.timestamp) {
            this.showConfirmationDialog(
              responseData.timestamp as string,
              URLExt.join(
                settings.baseUrl,
                'view',
                notebookPath.replace('.ipynb', '_hashcode.html')
              )
            );
          }
        } else {
          alert('failed to submit notebook');
        }
        this.unblockSubmitButton();
      })
      .catch(error => {
        this.unblockSubmitButton();
        throw new ServerConnection.NetworkError(error as TypeError);
      });
  };

  private showConfirmationDialog(timestamp: string, hashcodeUrl: string): void {
    showDialog({
      title: this.trans.__('Exam submission successful'),
      body: new SubmissionConfirmationWidget(this.trans, timestamp),
      buttons: [
        Dialog.cancelButton({
          label: this.trans.__('No, continue working on the exam'),
          className: SUBMISSION_REJECTION_BUTTON_CLASS
        }),
        Dialog.okButton({
          label: this.trans.__('Yes, exit exam'),
          className: SUBMISSION_CONFIRMATION_BUTTON_CLASS
        })
      ]
    }).then(result => {
      if (result.button.accept) {
        window.location.href = hashcodeUrl;
      }
    });
  }
}
