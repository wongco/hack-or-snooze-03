import { ajaxErrorOutput, API_BASE_URL } from '../helpers/classHelpers.js';
import { Story } from './Story.js';

/* instances contain a recent list a stories with methods to download, add & remove*/
export class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // downloads most recent 25 stories from api to local StoryList instance
  static async getStories() {
    const apiResponse = await $.ajax({
      url: `${API_BASE_URL}/stories`,
      method: 'GET',
      error: ajaxErrorOutput
    });

    const stories = apiResponse.stories.map(story => {
      const { author, title, url, username, storyId } = story;
      return new Story(author, title, url, username, storyId);
    });

    const storyList = new StoryList(stories);
    return storyList;
  }

  // method to initiate api call to add a new story
  async addStory(user, story) {
    const postDataObj = { story };

    await $.ajax({
      headers: { Authorization: `Bearer ${user.loginToken}` },
      url: `${API_BASE_URL}/stories`,
      method: 'POST',
      data: postDataObj,
      error: ajaxErrorOutput
    });

    await user.retrieveDetails();
  }

  // method to initiate api call to remove a story, then syncs api user details with local user
  async removeStory(user, storyId) {
    await $.ajax({
      headers: { Authorization: `Bearer ${user.loginToken}` },
      url: `${API_BASE_URL}/stories/${storyId}`,
      method: 'DELETE',
      error: ajaxErrorOutput
    });

    // find index of story to remove from local instance of StoryList
    const storyIndex = this.stories.findIndex(
      story => story.storyId === +storyId
    );
    // removes story from local instance
    this.stories.splice(storyIndex, 1);
    await user.retrieveDetails();
  }
}
