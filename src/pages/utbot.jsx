import * as React from "react";
import {useState} from "react";
import Survey from "../components/survey/survey.jsx";
import {graphql, useStaticQuery} from 'gatsby';

import Layout from "../components/layout";
import {useTranslation} from "react-i18next";
import {Alert, Button, ButtonGroup, NavDropdown, OverlayTrigger, Spinner, Tooltip} from "react-bootstrap";
import "./styles/page.css";
import "./styles/contact.css";
import dedent from "dedent";
import Editor from "@monaco-editor/react";
import {highlight, languages} from "prismjs/components/prism-core";
import SEO from "../components/seo";
import withTrans from "../i18n/withTrans";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism.css";


require("prismjs/components/prism-c");
require("prismjs/components/prism-cpp");


const snippetCTest = dedent`/*\n * This file is automatically generated by UnitTestBot. For further information see http://utbot.inhuawei.com\n * Copyright (c) Huawei Technologies Co., Ltd. 2021-2021. All rights reserved.\n */\n\n#include "snippet_test.h"\n\n#include "gtest/gtest.h"\nnamespace UTBot {\nstatic const float utbot_abs_error = 1e-6;\n\n\n\nTEST(regression, foo_test_1)\n{\n    int actual = foo();\n    EXPECT_EQ(0, actual);\n}\n\n}`;

const snippetC = dedent`#include <stdio.h>\n#include <string.h>\n#include <math.h>\n#include <stdlib.h>\n\nint foo() \n{\n  //TODO: write your code here\n  return 0;\n}`;

const snippetJava = dedent`import java.util.*;\n\npublic class Solution {\n  //TODO: write your code here\n}`;

const UTBotOnlinePage = () => {

    const [sourceCode, setSourceCode] = React.useState(snippetC);
    const [testCode, setTestCode] = React.useState(snippetCTest);
    const [showExamples, setShowExamples] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [language, setLanguage] = useState(1);
    const [showLanguages, setShowLanguages] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [href, setHref] = useState("");
    const [canRun, setCanRun] = useState(false);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [dirname, setDirname] = useState("");
    const [isSurveyActive, setIsSurveyActive] = useState(false);
    const [sourceForSurvey, setSourceForSurvey] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const examples = require("src/examples_json/examples.json");
    const examplesJava = require("src/examples_json/examples_java.json");

    const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          backend_host
          backend_survey_host
        }
      }
    }
  `);
    const backendHost = data.site.siteMetadata.backend_host;
    const backendSurveyHost = data.site.siteMetadata.backend_survey_host;

    React.useEffect(() => {
        const queryString = window.location.search;
        console.log(window.location);
        setHref(window.location.origin + window.location.pathname);
        const urlParams = new URLSearchParams(queryString);
        if (urlParams.has("source")) {
            setSourceCode(urlParams.get("source"));
            setTestCode("");
            setIsSurveyActive(false);
            setSourceForSurvey("");
            setIsSubmitted(false);
        }
        if (urlParams.has("language")) {
            if (urlParams.get("language") === "java") {
                setLanguage(2);
            }
        }
    }, []);

    function queryGenerateTests() {
        // eslint-disable-next-line no-console
        console.log("Generate!!!");
        setIsGenerating(true);
        setErrorText("");
        setTestCode("");
        setIsSurveyActive(false);
        setSourceForSurvey("");
        setIsSubmitted(false);
        setCanRun(false);

        const host = backendHost;
        const lang = language == 1 ? "C" : "Java";
        const req = `${host}/utbot-online/${lang}-playground/tests/`;
        const isInternetConnected = navigator.onLine;
        if (isInternetConnected) {
            fetch(req, {
                body: JSON.stringify({"snippet": sourceCode}),
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                method: "POST"
            })
                .then(response => response.json())
                .then(response => JSON.stringify(response))
                .then(response => {
                    const obj = JSON.parse(response);
                    if (obj.statusCode.localeCompare("SUCCEEDED") === 0) {
                        if (language === 1) {
                            setTestCode(obj.sourceFile);
                            setDirname(obj.dirname);
                            setCanRun(true);
                            // setIsSurveyActive(true);
                        } else {
                            setTestCode(obj.testSuite);
                            setIsSurveyActive(true);
                            setIsSubmitted(false);
                            setSourceForSurvey(sourceCode);
                        }
                        const details = obj.statusDetails ? obj.statusDetails.join('\n') : "no details";
                        setErrorText(`${obj.statusCode}:\n${details}`);
                    } else if (obj.statusCode) {
                        setTestCode("");
                        setIsSurveyActive(false);
                        setIsSubmitted(false);
                        setSourceForSurvey("");
                        const details = obj.statusDetails ? obj.statusDetails.join('\n') : "no details";
                        setErrorText(`${obj.statusCode}:\n${details}`);
                    } else {
                        setTestCode("");
                        setIsSurveyActive(false);
                        setIsSubmitted(false);
                        setSourceForSurvey("");
                        const details = obj.statusDetails ? obj.statusDetails.join('\n') : "no details";
                        setErrorText(`ERROR:\n${details}`);
                    }
                    console.log(response);
                })
                .finally(function () {
                    setIsGenerating(false);
                });
        } else {
            setIsGenerating(false);
            const details = "internet connection";
            setErrorText(`ERROR: ${details}`);

        }
    }

    function queryRunTests() {
        setIsRunningTests(true);
        console.log("Running!!!");
        setErrorText("");
        const host = backendHost;
        const lang = language == 1 ? "C" : "Java";
        const req = `${host}/utbot-online/${lang}-playground/run-tests/`;
        const isInternetConnected = navigator.onLine;

        if (isInternetConnected) {
            fetch(req, {
                body: JSON.stringify({"dirname": dirname}),
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                method: "POST"
            }).then(response => response.json())
                .then(response => JSON.stringify(response))
                .then(response => {
                    const obj = JSON.parse(response);
                    if (obj.statusCode.localeCompare("SUCCEEDED") === 0) {
                        const details = obj.statusDetails ? obj.statusDetails.join('\n') : "no details";
                        setErrorText(`${obj.statusCode}:\n${details}`);
                    } else if (obj.statusCode) {
                        const details = obj.statusDetails ? obj.statusDetails.join('\n') : "no details";
                        setErrorText(`${obj.statusCode}:\n${details}`);
                    } else {
                        const details = obj.statusDetails ? obj.statusDetails.join('\n') : "no details";
                        setErrorText(`ERROR:\n${details}`);
                    }
                    console.log(response);
                })
                .finally(function () {
                    setIsRunningTests(false);
                });
        } else {
            setIsRunningTests(false);
            const details = "internet connection";
            setErrorText(`ERROR: ${details}`);
        }
    }

    const showDropdownExamples = (e) => {
        setShowExamples(true);
    };
    const hideDropdownExamples = (e) => {
        setShowExamples(false);
    };

    const showDropdownLanguages = (e) => {
        setShowLanguages(true);
    };
    const hideDropdownLanguages = (e) => {
        setShowLanguages(false);
    };

    // TODO: move all string literals to locales/en/translations.json
    const {t, i18n} = useTranslation();

    let dropdownItems = null;
    if (language == 1) {
        dropdownItems = examples.examples.map(exampleCode => {
            return (
                <NavDropdown.Item
                    onClick={() => {
                        setSourceCode(exampleCode.code);
                        setCanRun(false);
                    }}> {exampleCode.name} </NavDropdown.Item>);
        });
    } else if (language == 2) {
        dropdownItems = examplesJava.examples.map(exampleCode => {
            return (
                <NavDropdown.Item
                    onClick={() => {
                        setSourceCode(exampleCode.code);
                        setCanRun(false);
                    }}> {exampleCode.name} </NavDropdown.Item>);
        });
    }

    const langName = language == 1 ? "C" : "Java";
    const langHighlight = language == 1 ? "cpp" : "java";

    let monacoThemesDefined = false;
    const defineMonacoThemes = monaco => {
        if (monacoThemesDefined) {
            return;
        }
        monacoThemesDefined = true;
        monaco.editor.defineTheme("my-light", {
            base: "vs",
            inherit: true,
            rules: [],
            colors: {
                "editor.background": "#f6f6f6",
                "minimap.background": "#f9f9f9"
            }
        });
    };
    const editorWillMountTemp = monaco => {
        defineMonacoThemes(monaco);
    };

    const url = `${href}?language=${language === 1 ? "c" : "java"}&source=${encodeURIComponent(sourceCode)}`;

    function copyLink() {
        if (navigator.clipboard && window.isSecureContext) {
            console.log(url);
            return navigator.clipboard.writeText(url);
        }
        // text area method
        const textArea = document.createElement("textarea");
        textArea.value = url;
        // make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        console.log(url);
        return new Promise((res, rej) => {
            // here the magic happens
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });

    }

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            Share with friends!
        </Tooltip>
    );

    return (
        <Layout>
            <SEO title="UTBot Online"/>
            <div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    marginLeft: "100px",
                    marginRight: "100px",
                    minWidth: "886px"
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center"
                    }}>
                        <div style={{
                            width: "100%",
                            minWidth: "440px",
                            marginRight: "3px",
                            flexDirection: "column"
                        }}>

                            <div
                                style={{
                                    marginTop: "20px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between"
                                }}>
                                <div
                                    style={{
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "row"
                                    }}>
                                    <OverlayTrigger
                                        placement="bottom"
                                        delay={{show: 250, hide: 250}}
                                        overlay={renderTooltip}
                                    >
                                        <Button
                                            variant="light"
                                            style={{marginTop: "5px", marginBottom: "5px", width: "125px"}}
                                            onClick={copyLink}
                                        >Copy Link</Button>
                                    </OverlayTrigger>
                                </div>
                                <div
                                    style={{
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "row"
                                    }}>

                                    <NavDropdown
                                        title={langName}
                                        show={showLanguages}
                                        onClick={(e) => {
                                        }}
                                        onMouseEnter={showDropdownLanguages}
                                        onMouseLeave={hideDropdownLanguages}
                                        style={{marginTop: "5px", width: "50px"}}
                                    >
                                        <NavDropdown.Item onClick={() => {
                                            setLanguage(1);
                                            if (language == 2) {
                                                setSourceCode(snippetC);
                                                setCanRun(false);
                                            }
                                        }}
                                        > C </NavDropdown.Item>
                                        <NavDropdown.Item onClick={() => {
                                            setLanguage(2);
                                            if (language == 1) {
                                                setSourceCode(snippetJava);
                                                setCanRun(false);
                                            }
                                        }}
                                        > Java </NavDropdown.Item>
                                    </NavDropdown>

                                    <NavDropdown
                                        title="Examples"
                                        show={showExamples}
                                        onClick={(e) => {
                                        }}
                                        onMouseEnter={showDropdownExamples}
                                        onMouseLeave={hideDropdownExamples}
                                        style={{marginTop: "5px"}}
                                    >
                                        {dropdownItems}
                                    </NavDropdown>

                                    <Button variant="primary" style={{
                                        marginTop: "5px",
                                        marginBottom: "5px",
                                        marginRight: "14px",
                                        width: "140px"
                                    }} onClick={queryGenerateTests} disabled={isGenerating}>
                                        {isGenerating && <span>Generating </span>}
                                        {!isGenerating && <span>Generate Tests</span>}
                                        {isGenerating && <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        />}

                                    </Button>
                                </div>
                            </div>
                            <div style={{
                                height: "calc(70vh)",
                                minHeight: "300px",
                                // width: "45vw",
                                minWidth: "440px"
                            }}
                            >
                                <Editor
                                    theme="my-light"
                                    language={langHighlight}
                                    onChange={(value) => {
                                        setSourceCode(value.slice(0, 5000));
                                        setCanRun(false);
                                    }}
                                    value={sourceCode}
                                    beforeMount={editorWillMountTemp.bind(this)}
                                    options={{
                                        tabSize: 4,
                                        scrollBeyondLastLine: false,
                                        wordWrap: "on"
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{
                            width: "100%",
                            marginLeft: "3px",
                            flexDirection: "column",
                            minWidth: "440px",
                            height: "100%"
                        }}>
                            <div
                                style={{
                                    marginTop: "20px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "flex-start"
                                }}>
                                <Button variant="info" style={{marginTop: "5px", marginBottom: "5px", width: "140px"}}
                                        onClick={queryRunTests} disabled={!canRun || isRunningTests}>
                                    {isRunningTests && <span>Running</span>}
                                    {!isRunningTests && <span>Run Tests</span>}
                                    {isRunningTests && <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />}
                                </Button>
                            </div>
                            <div style={{
                                height: "calc(70vh)",
                                minHeight: "300px",
                                minWidth: "440px"
                            }}
                            >
                                <Editor
                                    theme="my-light"
                                    language={langHighlight}
                                    value={testCode}
                                    beforeMount={editorWillMountTemp.bind(this)}
                                    options={{
                                        readOnly: true,
                                        scrollBeyondLastLine: false,
                                        wordWrap: "on"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: "1vh",
                        marginBottom: "1vh",
                        display: "flex",
                        flexDirection: "row",
                        minWidth: "886px",
                    }}>
                        {(isSurveyActive || isSubmitted) && <div style={{
                            width: "50%",
                            marginRight: "3px",
                            marinBottom: "0",
                            minWidth: "440px"
                        }}>
                            <Editor
                                theme="my-light"
                                language={langHighlight}
                                value={errorText}
                                options={{
                                    minimap: {enabled: false},
                                    lineNumbers: "off",
                                    readOnly: true,
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on"
                                }}
                            />
                        </div>}
                        {!(isSurveyActive || isSubmitted) && <div style={{
                            width: "100%",
                            marginRight: "3px",
                            minWidth: "440px",
                            height: "30vh",
                        }}>
                            <Editor
                                theme="my-light"
                                language={langHighlight}
                                value={errorText}
                                options={{
                                    minimap: {enabled: false},
                                    lineNumbers: "off",
                                    readOnly: true,
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on"
                                }}
                            />
                        </div>}
                        {isSurveyActive && <Survey sourceCode={sourceForSurvey} testCode={testCode}
                                                   backendSurveyHost={backendSurveyHost}/>}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default withTrans(UTBotOnlinePage);