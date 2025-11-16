import { TERMS_FR } from './terms_fr';
import { TERMS_TH } from './terms_th';

const TERMS_EN = `WinWai – Terms of Service

Last updated: June 2025
Operated by: Arkadya App, Morocco
Contact: contact@winwai.online

1. Introduction

These Terms of Service ("Terms") govern the access and use of the WinWai mobile application and related services (collectively, the "Service") operated by Arkadya App, a company registered under the laws of the Kingdom of Morocco.

By accessing or using WinWai, you agree to be bound by these Terms. If you do not agree, you must not use the Service.

2. Eligibility

Use of the Service is restricted to individuals who are at least 18 years old. By creating an account, you represent that you meet this age requirement and are legally capable of entering into binding contracts.

3. Description of Service

WinWai provides users with access to raffle games in which participation is entirely free of charge. Users may obtain raffle tickets by watching advertising content within the app.

Each prize is associated with a specific ticket threshold, and raffles are conducted once the required number of tickets has been reached. Raffles generally occur on a weekly basis, depending on ticket availability.

4. Raffle Participation

1. Participation in raffles is free; no purchase or payment of any kind is required.
2. Users earn tickets by watching advertisements through the app.
3. There is no limitation on the number of tickets a user may obtain.
4. Once the ticket threshold is reached, WinWai will automatically conduct a random draw using an internal algorithm to determine the winner.
5. The draw results are final and cannot be contested.

5. Prizes

1. Prizes are offered and managed by WinWai, and may include but are not limited to hotel stays, meals, spa or massage sessions, and similar experiences.
2. Prizes are delivered in the form of vouchers valid for three (3) months from the date of issue.
3. Prizes may be used personally by the winner or transferred to another person at the winner's discretion.
4. WinWai shall not be liable for lost, stolen, or expired vouchers.
5. Prizes have no cash value and cannot be exchanged or redeemed for money.
6. WinWai reserves the right to substitute a prize with one of equal or greater value if necessary.

6. Winner Notification

1. Winners will be notified via email and in-app notification.
2. If a winner does not claim their prize within the specified time period, WinWai reserves the right to forfeit the prize.
3. By participating, winners consent to WinWai using their first name and city for promotional purposes.

7. User Accounts

1. Users must register with a valid email address or Google account to participate.
2. Users are responsible for maintaining the confidentiality of their account credentials.
3. WinWai reserves the right to suspend or terminate any account found to be engaging in fraudulent activity.
4. Users may request account deletion by contacting contact@winwai.online.

8. Advertising and Third-Party Content

1. The Service displays advertisements provided by third-party ad networks, including Google AdMob.
2. WinWai is not responsible for the content or conduct of third-party advertisements.
3. Advertisements are required for the operation of the free raffle model.

9. Data and Privacy

WinWai collects only minimal user data necessary to operate the Service. For more information, please refer to our Privacy Policy.

10. Prohibited Conduct

Users agree not to:
- Attempt to manipulate or interfere with the raffle process
- Use bots, automation, or multiple accounts
- Post or transmit any unlawful or harmful content
- Attempt to reverse engineer any part of the Service

11. Limitation of Liability

WinWai and Arkadya App shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.

12. Termination and Suspension

WinWai reserves the right to suspend or terminate user access at any time for violations of these Terms.

13. Modifications

WinWai may revise these Terms from time to time. Continued use of the Service constitutes acceptance of the revised Terms.

14. Governing Law and Jurisdiction

These Terms are governed by and construed in accordance with the laws of the Kingdom of Morocco.

15. Contact

For questions regarding these Terms: contact@winwai.online`;

export function getTermsForLanguage(language: string): string {
  switch (language) {
    case 'fr':
      return TERMS_FR;
    case 'th':
      return TERMS_TH;
    case 'en':
    default:
      return TERMS_EN;
  }
}

export const PRIVACY_POLICY = `WinWai – Privacy Policy

Last updated: June 2025
Operated by: Arkadya App, Morocco
Contact: contact@winwai.online

1. Introduction

Arkadya App ("WinWai") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.

2. Information We Collect

Account Information:
• Email address (required)
• Name (optional)
• Profile picture (if you sign in with Google)

Usage Information:
• Device information
• App usage data
• Ad interaction data

Location Information:
• Approximate location (city/country level)
• We do NOT collect precise GPS location

3. How We Use Your Information

We use your information to:
• Create and manage your account
• Enable participation in raffles
• Notify winners
• Deliver prizes
• Display relevant advertisements
• Improve our Service
• Detect and prevent fraud

4. Information Sharing

We do NOT sell your personal information.

We may share your information with:
• Service Providers (Google AdMob, email services)
• Partners (when you win a prize)
• Legal authorities (if required by law)

5. Data Retention

We retain your information for as long as your account is active or as needed to provide services.

You may request account deletion at contact@winwai.online

6. Your Rights

You have the right to:
• Access your personal information
• Correct inaccurate information
• Request deletion of your account
• Object to processing

7. Security

We implement reasonable security measures to protect your information. However, no method of transmission is 100% secure.

8. Children's Privacy

Our Service is not intended for individuals under 18. We do not knowingly collect information from children.

9. Third-Party Advertising

We use Google AdMob to display advertisements. AdMob may collect information about your device and app usage.

For more information:
• Google's Privacy Policy: https://policies.google.com/privacy

10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes.

11. Contact Us

For questions about this Privacy Policy: contact@winwai.online
📧 Arkadya App, Morocco`;