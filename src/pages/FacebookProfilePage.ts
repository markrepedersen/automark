import {Page} from "./page";
import {
  elementIsVisible,
  findBy,
  log,
  TextInput,
  validate,
  WaitCondition,
  Button,
  WebComponent,
} from "../lib/utils";

@log
@validate
export class FacebookProfilePage extends Page {
  @findBy("a.profilePicThumb img")
  protected profilePic!: WebComponent;

  public loadCondition(): WaitCondition {
    return elementIsVisible(() => this.profilePic);
  }

  public async getProfilePicture(): Promise<string> {
    return this.profilePic.getElementAttribute("src");
  }
}
