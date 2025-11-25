/**
 * FlowPreview Example Usage
 *
 * Demonstrates how to use the FlowPreview component with sample data
 */

import React, { useState } from 'react';
import { FlowPreview } from './FlowPreview';
import { BuilderScreen } from '../../types';

/**
 * Example: Basic Flow Preview
 */
export function FlowPreviewExample() {
  const [currentScreenId, setCurrentScreenId] = useState('WELCOME');

  // Sample screens
  const sampleScreens: BuilderScreen[] = [
    {
      id: 'WELCOME',
      title: 'Welcome',
      terminal: false,
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome to Our Service',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'body-1',
          type: 'TextBody',
          config: {
            type: 'TextBody',
            text: 'Please enter your information to continue.',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'input-1',
          type: 'TextInput',
          config: {
            type: 'TextInput',
            label: 'Full Name',
            name: 'full_name',
            required: true,
            'helper-text': 'Enter your full name',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'input-2',
          type: 'TextInput',
          config: {
            type: 'TextInput',
            label: 'Email Address',
            name: 'email',
            'input-type': 'email',
            required: true,
            'helper-text': 'We will send a confirmation to this email',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'PREFERENCES',
              },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'PREFERENCES',
      title: 'Preferences',
      terminal: false,
      components: [
        {
          id: 'heading-2',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Your Preferences',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'checkbox-1',
          type: 'CheckboxGroup',
          config: {
            type: 'CheckboxGroup',
            label: 'Select your interests',
            name: 'interests',
            'data-source': [
              { id: 'tech', title: 'Technology', description: 'Stay updated with tech news' },
              { id: 'sports', title: 'Sports', description: 'Get sports updates' },
              { id: 'business', title: 'Business', description: 'Business and finance news' },
              { id: 'entertainment', title: 'Entertainment', description: 'Movies, music, and more' },
            ],
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'optin-1',
          type: 'OptIn',
          config: {
            type: 'OptIn',
            label: 'I agree to receive notifications',
            name: 'notifications_opt_in',
            required: true,
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-2',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Complete',
            'on-click-action': {
              name: 'complete',
              payload: {},
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const handleNavigate = (screenId: string) => {
    console.log('Navigating to:', screenId);
    setCurrentScreenId(screenId);
  };

  const handleComplete = (payload: any) => {
    console.log('Flow completed with payload:', payload);
    alert('Flow completed! Check console for payload data.');
  };

  return (
    <div className="h-screen">
      <FlowPreview
        screens={sampleScreens}
        currentScreenId={currentScreenId}
        onNavigate={handleNavigate}
        onComplete={handleComplete}
      />
    </div>
  );
}

/**
 * Example: Multi-Screen Flow with Radio Buttons and Dropdowns
 */
export function AdvancedFlowPreviewExample() {
  const [currentScreenId, setCurrentScreenId] = useState('SIGNUP');

  const advancedScreens: BuilderScreen[] = [
    {
      id: 'SIGNUP',
      title: 'Sign Up',
      terminal: false,
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Create Account',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'caption-1',
          type: 'TextCaption',
          config: {
            type: 'TextCaption',
            text: 'Join us today and get started',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'input-1',
          type: 'TextInput',
          config: {
            type: 'TextInput',
            label: 'Username',
            name: 'username',
            required: true,
            'min-chars': '3',
            'max-chars': '20',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'input-2',
          type: 'TextInput',
          config: {
            type: 'TextInput',
            label: 'Password',
            name: 'password',
            'input-type': 'password',
            required: true,
            'min-chars': '8',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'radio-1',
          type: 'RadioButtonsGroup',
          config: {
            type: 'RadioButtonsGroup',
            label: 'Account Type',
            name: 'account_type',
            required: true,
            'data-source': [
              { id: 'personal', title: 'Personal', description: 'For individual use' },
              { id: 'business', title: 'Business', description: 'For companies and teams' },
            ],
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Next',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'PROFILE',
              },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'PROFILE',
      title: 'Profile Details',
      terminal: false,
      components: [
        {
          id: 'heading-2',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Complete Your Profile',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'dropdown-1',
          type: 'Dropdown',
          config: {
            type: 'Dropdown',
            label: 'Country',
            name: 'country',
            required: true,
            'data-source': [
              { id: 'us', title: 'United States' },
              { id: 'uk', title: 'United Kingdom' },
              { id: 'ca', title: 'Canada' },
              { id: 'au', title: 'Australia' },
              { id: 'tr', title: 'Turkey' },
            ],
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'date-1',
          type: 'DatePicker',
          config: {
            type: 'DatePicker',
            label: 'Date of Birth',
            name: 'date_of_birth',
            required: true,
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'textarea-1',
          type: 'TextArea',
          config: {
            type: 'TextArea',
            label: 'Bio',
            name: 'bio',
            'helper-text': 'Tell us about yourself',
            'max-length': '500',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-2',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Finish',
            'on-click-action': {
              name: 'complete',
              payload: {},
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="h-screen">
      <FlowPreview
        screens={advancedScreens}
        currentScreenId={currentScreenId}
        onNavigate={setCurrentScreenId}
        onComplete={(payload) => {
          console.log('Registration completed:', payload);
          alert('Registration completed! Check console for details.');
        }}
      />
    </div>
  );
}

/**
 * Example: Dark Mode Preview
 */
export function DarkModeFlowPreviewExample() {
  const [currentScreenId, setCurrentScreenId] = useState('SURVEY');

  const surveyScreens: BuilderScreen[] = [
    {
      id: 'SURVEY',
      title: 'Customer Survey',
      terminal: false,
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'We Value Your Feedback',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'body-1',
          type: 'TextBody',
          config: {
            type: 'TextBody',
            text: 'Please take a moment to answer a few questions.',
            'font-weight': 'normal',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'radio-1',
          type: 'RadioButtonsGroup',
          config: {
            type: 'RadioButtonsGroup',
            label: 'How satisfied are you with our service?',
            name: 'satisfaction',
            required: true,
            'data-source': [
              { id: 'very_satisfied', title: 'Very Satisfied' },
              { id: 'satisfied', title: 'Satisfied' },
              { id: 'neutral', title: 'Neutral' },
              { id: 'dissatisfied', title: 'Dissatisfied' },
              { id: 'very_dissatisfied', title: 'Very Dissatisfied' },
            ],
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'textarea-1',
          type: 'TextArea',
          config: {
            type: 'TextArea',
            label: 'Additional Comments',
            name: 'comments',
            'helper-text': 'Share any additional feedback',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': {
              name: 'complete',
              payload: {},
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="h-screen dark">
      <FlowPreview
        screens={surveyScreens}
        currentScreenId={currentScreenId}
        onNavigate={setCurrentScreenId}
        onComplete={(payload) => {
          console.log('Survey submitted:', payload);
          alert('Thank you for your feedback!');
        }}
      />
    </div>
  );
}
