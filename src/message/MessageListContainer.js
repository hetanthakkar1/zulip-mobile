/* @flow */
import React, { PureComponent } from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';

import type {
  Actions,
  Auth,
  CaughtUp,
  Fetching,
  FlagsState,
  Message,
  Narrow,
  Subscription,
} from '../types';
import connectWithActions from '../connectWithActions';
import MessageList from '../render-native/MessageList';
// import MessageList from '../render-native/MessageListFlatList';
import MessageListWeb from '../render-html/MessageListWeb';
import {
  getAuth,
  getCurrentTypingUsers,
  getRenderedMessages,
  getActiveNarrow,
  getFlags,
  getAnchorForActiveNarrow,
  getFetchingForActiveNarrow,
  getSubscriptions,
  getShownMessagesInActiveNarrow,
} from '../selectors';
import { filterUnreadMessageIds } from '../utils/unread';
import { queueMarkAsRead } from '../api';

type Props = {
  actions: Actions,
  anchor: number,
  auth: Auth,
  caughtUp: CaughtUp,
  fetching: Fetching,
  flags: FlagsState,
  typingUsers: any,
  htmlMessages: boolean,
  messages: Message[],
  renderedMessages: any,
  subscriptions: Subscription[],
  narrow: Narrow,
  listRef: () => void,
  onReplySelect: () => void,
  onSend: () => void,
};

class MessageListContainer extends PureComponent<Props> {
  scrollOffset: number;
  props: Props;

  handleMessageListScroll = (e: Object) => {
    const { auth, flags } = this.props;
    const visibleMessageIds = e.visibleIds ? e.visibleIds.map(x => +x) : [];
    const unreadMessageIds = filterUnreadMessageIds(visibleMessageIds, flags);

    if (unreadMessageIds.length > 0) {
      queueMarkAsRead(auth, unreadMessageIds);
    }

    // Calculates the amount user has scrolled up from the very bottom
    this.scrollOffset = e.contentSize.height - e.contentOffset.y - e.layoutMeasurement.height;
  };

  render() {
    const {
      anchor,
      actions,
      fetching,
      messages,
      typingUsers,
      onReplySelect,
      renderedMessages,
      narrow,
      subscriptions,
      htmlMessages,
      listRef,
      onSend,
    } = this.props;

    const MessageListComponent = htmlMessages ? MessageListWeb : MessageList;

    return (
      <MessageListComponent
        auth={this.props.auth}
        anchor={anchor}
        subscriptions={subscriptions}
        isFetching={false}
        actions={actions}
        fetchingOlder={fetching.older}
        fetchingNewer={fetching.newer}
        onReplySelect={onReplySelect}
        typingUsers={typingUsers}
        renderedMessages={renderedMessages}
        messages={messages}
        narrow={narrow}
        listRef={listRef}
        onScroll={this.handleMessageListScroll}
        onSend={onSend}
      />
    );
  }
}

export default connectWithActions(state => ({
  htmlMessages: state.app.debug.htmlMessages,
  fetching: getFetchingForActiveNarrow(state),
  typingUsers: getCurrentTypingUsers(state),
  messages: getShownMessagesInActiveNarrow(state),
  renderedMessages: getRenderedMessages(state),
  anchor: getAnchorForActiveNarrow(state),
  subscriptions: getSubscriptions(state),
  narrow: getActiveNarrow(state),
  auth: getAuth(state),
  flags: getFlags(state),
}))(connectActionSheet(MessageListContainer));
