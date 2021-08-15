import { Embed } from '../model/Embed'
import { BaseProvider } from '../provider/BaseProvider'

/**
 * https://developer.atlassian.com/server/jira/platform/webhooks/
 */
class Jira extends BaseProvider {
    constructor() {
        super()
        this.setEmbedColor(0x1e45a8)
    }

    public getName(): string {
        return 'Jira'
    }

    public getPath(): string {
        return 'jira'
    }

    public async parseData(): Promise<void> {
        if (this.body.webhookEvent == null) {
            this.payload = null
            return
        }

        let isIssue: boolean
        if (this.body.webhookEvent.startsWith('jira:issue_')) {
            isIssue = true
        } else if (this.body.webhookEvent.startsWith('comment_')) {
            isIssue = false
        } else {
            return
        }

        // extract variable from Jira
        const issue = this.body.issue
        if (issue.fields.assignee == null) {
            issue.fields.assignee = { displayName: 'Unassigned' }
        }
        const user = this.body.user || { displayName: 'Anonymous' }
        const action = this.body.webhookEvent.split('_')[1]
        const matches = issue.self.match(/^(https?:\/\/[^/?#]+)(?:[/?#]|$)/i)
        const domain = matches && matches[1]

        // create the embed
        const embed = new Embed()
        embed.title = `${issue.key} - ${issue.fields.summary}`
        embed.url = `${domain}/browse/${issue.key}`
        if (isIssue) {
            embed.fields = [
                { name: 'Action', value: `Issue ${action}`, inline: true },
                { name: 'Author', value: user.displayName, inline: true },
                { name: 'Assignee', value: issue.fields.assignee.displayName, inline: true },
            ]
        } else {
            const comment = this.body.comment
            embed.fields = [
                { name: 'Action', value: `[Comment ${action}](${domain}/browse/${issue.key}?focusedCommentId=${comment.id})`, inline: true },
                { name: 'Author', value: comment.updateAuthor.displayName, inline: true },
                { name: 'Body', value: comment.body, inline: false },
            ]
        }
        this.addEmbed(embed)
    }
}

export { Jira }
