const chalk = require('chalk');

/**
 * Print success message
 */
function success(message) {
  console.log(chalk.green('✅'), message);
}

/**
 * Print error message
 */
function error(message) {
  console.log(chalk.red('❌'), message);
}

/**
 * Print warning message
 */
function warning(message) {
  console.log(chalk.yellow('⚠️'), message);
}

/**
 * Print info message
 */
function info(message) {
  console.log(chalk.blue('ℹ️'), message);
}

/**
 * Print section header
 */
function header(message) {
  console.log(chalk.bold.cyan('\n' + '='.repeat(50)));
  console.log(chalk.bold.cyan(message));
  console.log(chalk.bold.cyan('='.repeat(50) + '\n'));
}

/**
 * Print verdict
 */
function verdict(passed, message) {
  if (passed) {
    console.log(chalk.bold.green('\n✅ ' + message));
  } else {
    console.log(chalk.bold.red('\n❌ ' + message));
  }
}

/**
 * Print list of issues
 */
function printIssues(issues, type = 'error') {
  if (issues.length === 0) return;
  
  issues.forEach(issue => {
    if (type === 'error') {
      error(issue);
    } else if (type === 'warning') {
      warning(issue);
    } else {
      info(issue);
    }
  });
}

module.exports = {
  success,
  error,
  warning,
  info,
  header,
  verdict,
  printIssues
};

